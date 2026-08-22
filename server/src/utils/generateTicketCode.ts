import Counter from '../models/Counter';

/**
 * Generate unique ticket code: TMS-YYYY-NNNNNN
 */
const generateTicketCode = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const key = `ticket_${year}`;

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  if (!counter) {
    throw new Error('Failed to generate ticket code');
  }

  const seq = String(counter.seq).padStart(6, '0');
  return `TMS-${year}-${seq}`;
};

export default generateTicketCode;
