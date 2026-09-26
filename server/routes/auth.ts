import { Router, Request, Response } from 'express';
import { dbGet, dbRun, dbAll } from '../db.ts';

export const authRouter = Router();

// Password strength validation helper
export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter (A-Z).' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter (a-z).' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number (0-9).' };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*...).' };
  }
  return { valid: true };
}

// Email or phone validation helper
export function validateEmailOrPhone(input: string): { valid: boolean; type: 'email' | 'phone'; cleaned: string; message?: string } {
  const trimmed = (input || '').trim();
  if (!trimmed) {
    return { valid: false, type: 'email', cleaned: '', message: 'Email or phone number is required.' };
  }
  // Check email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmed)) {
    return { valid: true, type: 'email', cleaned: trimmed.toLowerCase() };
  }
  // Check phone (strip non-digits)
  const phoneDigits = trimmed.replace(/\D/g, '');
  if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
    return { valid: true, type: 'phone', cleaned: phoneDigits };
  }

  return { valid: false, type: 'email', cleaned: trimmed, message: 'Please enter a valid email address or phone number (at least 10 digits).' };
}

// 1. LOGIN
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email or username and password are required' });
    }

    const trimmedInput = email.trim();

    // Query user by email OR phone
    const user = await dbGet<any>(
      `SELECT id, name, email, phone, role, department, password_hash, is_verified, verification_otp, created_at 
       FROM users 
       WHERE LOWER(email) = LOWER(?) OR phone = ?`,
      [trimmedInput, trimmedInput.replace(/\D/g, '')]
    );

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password. Please verify your credentials and try again.' });
    }

    // Check verification status
    if (user.is_verified === 0) {
      return res.status(403).json({
        error: 'Your account is pending verification. Please enter the 6-digit confirmation code sent to your email/phone.',
        requiresVerification: true,
        email: user.email,
        otpPreview: user.verification_otp
      });
    }

    const { password_hash, verification_otp, ...safeUser } = user;
    return res.json({
      message: 'Login successful',
      user: safeUser,
      token: `stk_token_${user.id}_${Date.now()}`
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// 2. SIGNUP (Creates unverified account and generates OTP)
authRouter.post('/signup', async (req: Request, res: Response) => {
  try {
    const { name, email, phone, password, role, department } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required' });
    }

    const identifierCheck = validateEmailOrPhone(email);
    if (!identifierCheck.valid) {
      return res.status(400).json({ error: identifierCheck.message });
    }

    const passCheck = validatePasswordStrength(password);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    // Check if account already exists
    const cleanEmail = identifierCheck.type === 'email' ? identifierCheck.cleaned : `${identifierCheck.cleaned}@stocksense.local`;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : (identifierCheck.type === 'phone' ? identifierCheck.cleaned : null);

    const existing = await dbGet(
      'SELECT id, is_verified FROM users WHERE LOWER(email) = LOWER(?) OR (phone IS NOT NULL AND phone = ?)',
      [cleanEmail, cleanPhone || '']
    );

    if (existing) {
      if (existing.is_verified === 1) {
        return res.status(409).json({ error: 'An account with this email or phone already exists. Please sign in instead.' });
      }
      // If unverified, regenerate OTP for existing record
      const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await dbRun(
        'UPDATE users SET password_hash = ?, verification_otp = ?, verification_expires_at = ?, name = ? WHERE id = ?',
        [password, newOtp, expiresAt, name.trim(), existing.id]
      );

      return res.status(200).json({
        message: 'Account pending verification. A fresh confirmation code has been generated.',
        requiresVerification: true,
        email: cleanEmail,
        otpPreview: newOtp
      });
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins expiry

    // Save with is_verified = 0
    await dbRun(
      `INSERT INTO users (id, name, email, phone, password_hash, role, department, is_verified, verification_otp, verification_expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        cleanEmail,
        cleanPhone,
        password,
        role || 'Inventory Manager',
        department || 'Logistics & Supply Chain',
        otp,
        expiresAt,
        now
      ]
    );

    return res.status(201).json({
      message: 'Account registered. Please enter the 6-digit confirmation code to activate your account.',
      requiresVerification: true,
      email: cleanEmail,
      otpPreview: otp
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during account registration' });
  }
});

// 3. VERIFY SIGNUP OTP (Activates account and grants full access)
authRouter.post('/verify-signup-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit confirmation code are required' });
    }

    const user = await dbGet<any>(
      `SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?`,
      [email.trim(), email.trim().replace(/\D/g, '')]
    );

    if (!user) {
      return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    }

    if (user.is_verified === 1) {
      const { password_hash, verification_otp, ...safeUser } = user;
      return res.json({
        message: 'Account is already verified. You may sign in.',
        user: safeUser,
        token: `stk_token_${user.id}_${Date.now()}`
      });
    }

    if (user.verification_otp !== otp.trim()) {
      return res.status(400).json({ error: 'Invalid verification code. Please check the code and try again.' });
    }

    if (user.verification_expires_at && new Date(user.verification_expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Activate user
    await dbRun(
      'UPDATE users SET is_verified = 1, verification_otp = NULL, verification_expires_at = NULL WHERE id = ?',
      [user.id]
    );

    const { password_hash, verification_otp, ...safeUser } = user;
    safeUser.is_verified = 1;

    return res.json({
      message: 'Account successfully activated! Welcome to StockSense.',
      user: safeUser,
      token: `stk_token_${user.id}_${Date.now()}`
    });
  } catch (err: any) {
    console.error('Verification error:', err);
    return res.status(500).json({ error: 'Failed to verify confirmation code' });
  }
});

// 4. RESEND SIGNUP OTP
authRouter.post('/resend-verification-otp', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email or phone number is required' });
    }

    const user = await dbGet<any>(
      `SELECT id, email, phone, is_verified FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?`,
      [email.trim(), email.trim().replace(/\D/g, '')]
    );

    if (!user) {
      return res.status(404).json({ error: 'No account found with this identifier' });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({ error: 'This account is already verified. Please sign in.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await dbRun(
      'UPDATE users SET verification_otp = ?, verification_expires_at = ? WHERE id = ?',
      [newOtp, expiresAt, user.id]
    );

    return res.json({
      message: `A new 6-digit verification code has been generated. Valid for 15 minutes.`,
      otpPreview: newOtp
    });
  } catch (err: any) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ error: 'Failed to resend confirmation code' });
  }
});

// 5. FORGOT PASSWORD (REQUEST OTP)
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Please enter your registered email address or phone number' });
    }

    const user = await dbGet<any>(
      'SELECT id, name, email FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?',
      [email.trim(), email.trim().replace(/\D/g, '')]
    );

    if (!user) {
      return res.status(404).json({
        error: 'No active account found with this email address or phone number.'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetId = `rst_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    await dbRun(
      `INSERT INTO password_resets (id, email, otp, expires_at, used, created_at)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [resetId, user.email, otp, expiresAt, now]
    );

    return res.json({
      message: `A 6-digit password reset code has been generated for ${user.email}. Valid for 15 minutes.`,
      email: user.email,
      otpPreview: otp
    });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to generate password reset code' });
  }
});

// 6. VERIFY RESET OTP (Step 2 of Password Reset)
authRouter.post('/verify-reset-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and 6-digit OTP code are required' });
    }

    const resetRecord = await dbGet<any>(
      `SELECT * FROM password_resets 
       WHERE LOWER(email) = LOWER(?) AND otp = ? AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [email.trim(), otp.trim()]
    );

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid reset code. Please check the code and try again.' });
    }

    if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Reset code has expired. Please request a new code.' });
    }

    return res.json({ valid: true, message: 'Code confirmed. You can now set your new password.' });
  } catch (err: any) {
    console.error('Verify reset OTP error:', err);
    return res.status(500).json({ error: 'Failed to verify reset code' });
  }
});

// 7. RESET PASSWORD (Step 3: sets new password and marks OTP used)
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, confirmation code, and new password are required' });
    }

    const passCheck = validatePasswordStrength(newPassword);
    if (!passCheck.valid) {
      return res.status(400).json({ error: passCheck.message });
    }

    const resetRecord = await dbGet<any>(
      `SELECT * FROM password_resets 
       WHERE LOWER(email) = LOWER(?) AND otp = ? AND used = 0
       ORDER BY created_at DESC LIMIT 1`,
      [email.trim(), otp.trim()]
    );

    if (!resetRecord) {
      return res.status(400).json({ error: 'Invalid or expired confirmation code.' });
    }

    if (new Date(resetRecord.expires_at).getTime() < Date.now()) {
      return res.status(400).json({ error: 'Confirmation code has expired. Please request a new code.' });
    }

    // Mark OTP as used
    await dbRun('UPDATE password_resets SET used = 1 WHERE id = ?', [resetRecord.id]);

    // Update user password and activate if unverified
    await dbRun(
      'UPDATE users SET password_hash = ?, is_verified = 1 WHERE LOWER(email) = LOWER(?)',
      [newPassword, email.trim()]
    );

    return res.json({ message: 'Password has been successfully updated. You may now log in with your new password.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

// 8. GET CURRENT PROFILE (Authenticated)
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const user = await dbGet<any>(
      'SELECT id, name, email, phone, role, department, is_verified, created_at FROM users WHERE is_verified = 1 LIMIT 1'
    );
    if (!user) {
      return res.status(404).json({ error: 'No active user profile found' });
    }
    return res.json({ user });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// 9. UPDATE PROFILE
authRouter.put('/profile', async (req: Request, res: Response) => {
  try {
    const { id, name, role, department, phone } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: 'User ID and name are required' });
    }
    await dbRun(
      'UPDATE users SET name = ?, role = ?, department = ?, phone = ? WHERE id = ?',
      [name.trim(), role || 'Inventory Manager', department || 'Logistics', phone || null, id]
    );

    const updated = await dbGet<any>(
      'SELECT id, name, email, phone, role, department, is_verified, created_at FROM users WHERE id = ?',
      [id]
    );
    return res.json({ message: 'Profile updated successfully', user: updated });
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});
