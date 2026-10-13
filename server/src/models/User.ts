import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const ROLES = ['superadmin', 'admin', 'manager', 'employee'] as const;
export type UserRole = (typeof ROLES)[number];

export interface IUserSafeObject {
  id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: UserRole;
  department: mongoose.Types.ObjectId | null;
  departments: mongoose.Types.ObjectId[];
  managers?: any[];
  employees?: any[];
  phone: string;
  rollNumber: string;
  avatarUrl: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: mongoose.Types.ObjectId | null;
  departments?: mongoose.Types.ObjectId[];
  managers?: mongoose.Types.ObjectId[];
  employees?: mongoose.Types.ObjectId[];
  phone: string;
  rollNumber: string;
  avatarUrl: string;
  isActive: boolean;
  lastLogin: Date | null;
  createdBy: mongoose.Types.ObjectId | null;
  refreshToken: string | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  loginAttempts: number;
  lockUntil: Date | null;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  isLocked(): boolean;
  toSafeObject(): IUserSafeObject;
}

export type IUserDocument = HydratedDocument<IUser>;

export const getUserDepartmentIds = (user?: {
  department?: unknown;
  departments?: unknown[];
} | null): string[] => {
  if (!user) return [];
  const ids = new Set<string>();
  if (Array.isArray(user.departments)) {
    for (const d of user.departments) {
      if (!d) continue;
      if (typeof d === 'object' && '_id' in (d as object)) {
        ids.add(String((d as { _id: unknown })._id));
      } else {
        ids.add(String(d));
      }
    }
  }
  if (user.department) {
    if (typeof user.department === 'object' && '_id' in (user.department as object)) {
      ids.add(String((user.department as { _id: unknown })._id));
    } else {
      ids.add(String(user.department));
    }
  }
  return Array.from(ids);
};

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ROLES, required: true },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    departments: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
    ],
    managers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    employees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    phone: { type: String, trim: true, default: '' },
    rollNumber: { type: String, trim: true, default: '' },
    avatarUrl: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    refreshToken: { type: String, select: false, default: null },
    passwordResetToken: { type: String, select: false, default: null },
    passwordResetExpires: { type: Date, select: false, default: null },
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },
    mustChangePassword: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, department: 1 });
userSchema.index({ departments: 1 });

userSchema.pre('save', async function syncData(next) {
  if (Array.isArray(this.departments) && this.departments.length > 0) {
    if (!this.department || !this.departments.some((d) => String(d) === String(this.department))) {
      this.department = this.departments[0];
    }
  } else if (this.department) {
    this.departments = [this.department];
  }

  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  return next();
});

userSchema.methods.comparePassword = async function comparePassword(
  this: IUserDocument,
  candidate: string
): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function isLocked(this: IUserDocument): boolean {
  return Boolean(this.lockUntil && this.lockUntil > new Date());
};

userSchema.methods.toSafeObject = function toSafeObject(this: IUserDocument): IUserSafeObject {
  const depts = (this.departments && this.departments.length > 0)
    ? this.departments
    : (this.department ? [this.department] : []);

  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    departments: depts,
    managers: this.managers || [],
    employees: this.employees || [],
    phone: this.phone,
    rollNumber: this.rollNumber || '',
    avatarUrl: this.avatarUrl,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
