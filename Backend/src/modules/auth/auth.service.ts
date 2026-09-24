import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../prisma/db';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const loginUser = async (email: string, pass: string) => {
  const user = await db.orm.public.User
    .where({ email, isDeleted: 0 })
    .first();
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await bcrypt.compare(pass, user.password);
  if (!isMatch) throw new Error('Invalid email or password');

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    token,
  };
};
