import mongoose, { Document, Schema } from 'mongoose';
import {
  type Recruitment as IRecruitment,
  FormField,
} from '@event-management/shared';

// Mongoose Document interface with ObjectId references
export interface IRecruitmentDocument extends Document {
  title: string;
  description: string;
  club: mongoose.Types.ObjectId;
  deadline: Date;
  applicationForm: FormField[];
  isActive: boolean; // Virtual field
  createdAt: Date;
  updatedAt: Date;
}

const recruitmentSchema = new Schema<IRecruitmentDocument>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  club: {
    type: Schema.Types.ObjectId,
    ref: 'Club',
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  applicationForm: [
    {
      id: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: [
          'text',
          'email',
          'number',
          'textarea',
          'select',
          'radio',
          'checkbox',
          'file',
          'date',
        ],
        required: true,
      },
      required: {
        type: Boolean,
        default: false,
      },
      placeholder: {
        type: String,
      },
      options: [
        {
          type: String,
        },
      ],
      validation: {
        minLength: Number,
        maxLength: Number,
        min: Number,
        max: Number,
        pattern: String,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Virtual for isActive
recruitmentSchema.virtual('isActive').get(function (
  this: IRecruitmentDocument
) {
  return this.deadline > new Date();
});

recruitmentSchema.set('toObject', { virtuals: true });
recruitmentSchema.set('toJSON', { virtuals: true });

// Pre-save middleware to update the updatedAt field
recruitmentSchema.pre('save', function (this: IRecruitmentDocument, next) {
  this.updatedAt = new Date();
  next();
});

// Static methods
recruitmentSchema.statics.findByClub = function (clubId: string) {
  return this.find({ club: clubId }).populate('club', 'name');
};

recruitmentSchema.statics.findActive = function () {
  return this.find({ deadline: { $gte: new Date() } }).populate('club', 'name');
};

recruitmentSchema.statics.findExpired = function () {
  return this.find({ deadline: { $lt: new Date() } }).populate('club', 'name');
};

recruitmentSchema.statics.findByDeadlineRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    deadline: { $gte: startDate, $lte: endDate },
  }).populate('club', 'name');
};

// Instance methods
recruitmentSchema.methods.extendDeadline = function (newDeadline: Date) {
  this.deadline = newDeadline;
  return this.save();
};

recruitmentSchema.methods.addFormField = function (field: FormField) {
  this.applicationForm.push(field);
  return this.save();
};

recruitmentSchema.methods.updateFormField = function (
  fieldId: string,
  updatedField: Partial<FormField>
) {
  const fieldIndex = this.applicationForm.findIndex(
    (field: FormField) => field.id === fieldId
  );
  if (fieldIndex !== -1) {
    this.applicationForm[fieldIndex] = {
      ...this.applicationForm[fieldIndex],
      ...updatedField,
    };
  }
  return this.save();
};

recruitmentSchema.methods.removeFormField = function (fieldId: string) {
  this.applicationForm = this.applicationForm.filter(
    (field: FormField) => field.id !== fieldId
  );
  return this.save();
};

// Add indexes for better query performance
recruitmentSchema.index({ club: 1 });
recruitmentSchema.index({ deadline: 1 });
recruitmentSchema.index({ createdAt: -1 });

const Recruitment = mongoose.model<IRecruitmentDocument>(
  'Recruitment',
  recruitmentSchema
);

export default Recruitment;
