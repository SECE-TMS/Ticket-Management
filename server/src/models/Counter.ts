import mongoose, { Schema, type HydratedDocument, type Model } from 'mongoose';

export interface ICounter {
  key: string;
  seq: number;
}

export type ICounterDocument = HydratedDocument<ICounter>;

const counterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const Counter: Model<ICounter> = mongoose.model<ICounter>('Counter', counterSchema);

export default Counter;
