const mongoose = require('mongoose');
const bcrypt    = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Personal
    fullName:   { type: String,  required: true, trim: true },
    mobile:     { type: String,  required: true, unique: true, trim: true },
    email:      { type: String,  required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String,  required: true, minlength: 6 },

    // Account type — drives B2B/B2C mode
    accountType: {
      type:    String,
      enum:    ['farmer', 'retail_customer', 'dealer_distributor', 'best_pricer', 'business_buyer'],
      default: 'retail_customer',
    },

    // Location — needed for pin-code routing, regional offers
    state:    { type: String, default: '' },
    district: { type: String, default: '' },
    city:     { type: String, default: '' },  // village / city

    // Account meta
    isActive:       { type: Boolean, default: true },
    isEmailVerified:{ type: Boolean, default: false },
    avatar:         { type: String,  default: '' },
    wishlist:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Safe public profile (strip password)
userSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
