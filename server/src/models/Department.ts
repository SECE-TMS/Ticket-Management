import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface IDepartment {
  name: string;
  description: string;
  manager: mongoose.Types.ObjectId | null;
  complaintTypes: string[];
  slaHours: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type IDepartmentDocument = HydratedDocument<IDepartment>;

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    complaintTypes: [{ type: String, trim: true }],
    slaHours: { type: Number, default: 48, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Department: Model<IDepartment> = mongoose.model<IDepartment>('Department', departmentSchema);

export default Department;
