import Counter from '../models/Counter';

/**
 * Generate unique ticket code: NNNN (starting from 1000, e.g. 1000, 1001, 1002...)
 */
const generateTicketCode = async (): Promise<string> => {
  const key = 'ticket_seq';

  // Ensure sequence baseline is at least 999 so next increment produces >= 1000
  await Counter.updateOne(
    { key, seq: { $lt: 999 } },
    { $set: { seq: 999 } }
  );

  const counter = await Counter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  if (!counter) {
    throw new Error('Failed to generate ticket code');
  }

  // If newly upserted counter had started below 1000, adjust to 1000
  let seqNumber = counter.seq;
  if (seqNumber < 1000) {
    const adjusted = await Counter.findOneAndUpdate(
      { key, seq: { $lt: 1000 } },
      { $set: { seq: 1000 } },
      { new: true }
    );
    seqNumber = adjusted ? adjusted.seq : 1000;
  }

  return String(seqNumber);
};

export default generateTicketCode;
