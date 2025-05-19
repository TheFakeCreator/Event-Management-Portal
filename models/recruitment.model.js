import mongoose from 'mongoose';

const recruitmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

recruitmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Recruitment = mongoose.model('Recruitment', recruitmentSchema);
export default Recruitment;
