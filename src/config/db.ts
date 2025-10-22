import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://nedparcel_db_user:nedparcel@nedparcel.7zcjxxz.mongodb.net/?retryWrites=true&w=majority&appName=nedparcel');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
