// Database seeding script for Chic Charms local emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

const path = require('path');
const admin = require(path.resolve(__dirname, './functions/node_modules/firebase-admin'));

admin.initializeApp({
  projectId: 'chic-charms-store'
});

const db = admin.firestore();

const sampleProducts = [
  {
    name: 'Gold Star Studs',
    price: 199,
    stock: 15,
    description: 'Delicate 18k gold-plated celestial studs, perfect for daily radiance.',
    image: 'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=500&auto=format&fit=crop&q=85',
    category: 'Everyday Elegance',
    categorySlug: 'everyday-elegance',
    rating: 4.8
  },
  {
    name: 'Silver Hoops',
    price: 249,
    stock: 12,
    description: 'Classic sterling silver hoop earrings with a modern, high-polish finish.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=85',
    category: 'Modern Romance',
    categorySlug: 'modern-romance',
    rating: 4.7
  },
  {
    name: 'Pearl Drop Earrings',
    price: 299,
    stock: 8,
    description: 'Timeless freshwater pearls dangling from elegant gold-filled hooks.',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=700&auto=format&fit=crop&q=85',
    category: 'Heritage Muse',
    categorySlug: 'heritage-muse',
    rating: 4.9
  },
  {
    name: 'Evening Glamour Dangles',
    price: 299,
    stock: 5,
    description: 'Stunning purple crystal statement earrings designed to catch the light.',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=700&auto=format&fit=crop&q=85',
    category: 'After Dark',
    categorySlug: 'after-dark',
    rating: 4.6
  }
];

async function seed() {
  console.log('Seeding sample products into Firestore emulator (localhost:8080)...');
  const collectionRef = db.collection('products');
  
  // Clear any existing products first
  const existingDocs = await collectionRef.get();
  for (const doc of existingDocs.docs) {
    await doc.ref.delete();
  }
  console.log('Cleared existing product collection.');

  // Write new ones
  for (const product of sampleProducts) {
    const docRef = await collectionRef.add(product);
    console.log(`Added product: ${product.name} (ID: ${docRef.id})`);
  }
  
  console.log('Seeding complete! 🎉');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error seeding products:', err);
  process.exit(1);
});
