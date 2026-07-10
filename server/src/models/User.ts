import mongoose, { Schema, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

userSchema.set('toJSON', {
  transform: (_document, returnedObject) => {
    delete (returnedObject as { password?: string }).password;
    return returnedObject;
  }
});

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const User = mongoose.model('User', userSchema);
