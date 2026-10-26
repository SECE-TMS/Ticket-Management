import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface IFloor {
  floorName: string;
  defaultAssignee?: mongoose.Types.ObjectId | null;
}

export interface IBlock {
  blockName: string;
  floors: IFloor[];
}

export interface IDepartment {
  name: string;
  description: string;
  manager: mongoose.Types.ObjectId | null;
  defaultAssignee: mongoose.Types.ObjectId | null;
  complaintTypes: string[];
  slaHours: number;
  isActive: boolean;
  locationEnabled: boolean;
  blocks: IBlock[];
  createdAt: Date;
  updatedAt: Date;
}

export type IDepartmentDocument = HydratedDocument<IDepartment>;

const floorSchema = new Schema<IFloor>(
  {
    floorName: { type: String, required: true, trim: true },
    defaultAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { _id: true }
);

const blockSchema = new Schema<IBlock>(
  {
    blockName: { type: String, required: true, trim: true },
    floors: { type: [floorSchema], default: [] },
  },
  { _id: true }
);

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    manager: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    defaultAssignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    complaintTypes: [{ type: String, trim: true }],
    slaHours: { type: Number, default: 48, min: 1 },
    isActive: { type: Boolean, default: true },
    locationEnabled: { type: Boolean, default: false },
    blocks: { type: [blockSchema], default: [] },
  },
  { timestamps: true }
);

const Department: Model<IDepartment> = mongoose.model<IDepartment>('Department', departmentSchema);

export default Department;
