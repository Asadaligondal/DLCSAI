import mongoose from 'mongoose';

const AccommodationSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, 'Category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.models.Accommodation || mongoose.model('Accommodation', AccommodationSchema);
