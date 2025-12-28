import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017/event-management';

mongoose.connect(uri).then(async () => {
  console.log('Connected to MongoDB');
  
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  
  console.log(`\nFound ${users.length} users:\n`);
  users.forEach(user => {
    console.log(`- ${user.name} (${user.email})`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Verified: ${user.isVerified}`);
    console.log(`  ID: ${user._id}\n`);
  });
  
  await mongoose.disconnect();
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
