const express = require('express');

const { MongoClient, ObjectId } = require('mongodb'); // mongoDB নিয়ে কাজ করার সময় এটা রিকোয়ার করতে হয় এবং (MongoClient, ObjectId) extract করতে হয়। কারণ, অনেক সময় আমাদের mongoDB এর মধ্যে _id টা আছে, সেটা ধরে কাজ করত হয়। তখন _id: ObjectId('250w02840284028408') এভাবে বলে দিতে হয়।

require('dotenv').config();
const app = express();

app.use(express.json()); // json টাইপের ডাটা নিয়ে কাজ করতে প্রোয়োজন হয়। যেমন - ক্লাইন্ট সাইট থেকে একটা json ডাটা আসছে তখন, এটা না দিলে ঐ ক্লাইন্ট সাইট থেকে আসা ডাটা নিয়ে কাজ করা যাবে না।

// এই পোর্ট-এ আমাদের সার্ভার রান করবে
const port = process.env.PORT || 4000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pn1pz.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
client.connect((err) => {
	// এটা mongoDB এর কালেকশনের নাম। বাই ডিফল্ট collection নাম থাকে। আমি এখানে চেইন্জ করে verityCollection দিয়েছি
	const verityCollection = client
		.db(`${process.env.DB_NAME}`)
		.collection('verity');

	// আমি এখান থেকে mongoDB তে ডাটা insert করেছি। একটি ডাটা insert করলে insertOne দিতে হয় আর একের অধিক ডাটা insert করতে চাইলে insertMany দিতে হয় ।
	app.post('/addFood', (req, res) => {
		const food = req.body;
		// verityCollection.insertMany(food).then((result) => console.log(result));
		verityCollection.insertOne(food).then((result) => console.log(result));
		res.status(201).send('Data successfully created');
	});

	// mongoDB থেকে সমস্থ ডাটা লোড বা read করে ক্লাইন্ড সাইটে দেখাতে চাইলে নিচের পদ্ধতি অনুসরণ করে কাজ করতে হয়। এক্ষেত্রে .toArray() - find() মেথডের পরে দিতেই হবে। .toArray() মেথড mongoDB থেকে আসা সমস্থ ডাটাগুলো একটা অ্যারের মধ্যে প্যাক করে দেয়।
	app.get('/loadFood', async (req, res) => {
		const allFoodArray = await verityCollection.find().toArray();
		if (allFoodArray.length > 0) {
			res.send(allFoodArray);
		}
	});

	// client site থেকে আসাা dynamic id দিয়ে mongoDB এর মধ্যে থেকে চাইলে যেকোনো ডাটা read করা যায়। জাস্ট .find মেথডের মধ্যে dynamic id টা বলে দেয়া { _id: ObjectId(foodId) }।
	app.get('/food/:id', async (req, res) => {
		const foodId = req.params.id;
		const result = await verityCollection
			.find({ _id: ObjectId(foodId) })
			.toArray();
		res.status(200).send(result[0]);
	});

	// client site থেকে আসাা dynamic id দিয়ে mongoDB এর মধ্যে থেকে চাইলে যেকোনো ডাটা update করা যায়।
	app.patch('/update/:id', (req, res) => {
		verityCollection
			.updateOne(
				//  item অর্থাৎ যেটা আপডেট করব সেটা আইডি দিয়ে ধরে এভাবে কাজ করব
				{ _id: ObjectId(req.params.id) },
				{ $set: { price: 300, qty: 1 } }
			)
			.then((result) => {
				if (result.modifiedCount > 0) {
					res.status(200).send('Update successfully');
				}
			});
	});

	// delete food data from database
	app.delete('/delete/:id', async (req, res) => {
		const result = await verityCollection.deleteOne({
			_id: ObjectId(req.params.id),
		});
		if (result.deletedCount > 0) {
			res.send('Successfully Delete the food');
		}
	});

	// এখানে mongodb থেকে user specific ডাটা read করতে ইউজারে email ব্যবহার করা হয়েছে। এজন্য ক্লাইন্ট সাইটে একটা কুয়েরি দিতে হয় যেমন - localhost:4000/justifyFood?email=apel@gmail.com
	app.get('/justifyFood', async (req, res) => {
		const userEmail = req.query.email;
		const result = await verityCollection.find({ email: userEmail }).toArray();
		res.send(result);
	});

	console.log('Db connected');
});

app.get('/', (req, res) => {
	console.log('Hello express server');
	res.send('I am working...');
});

app.listen(port, () => console.log(`App listening on port ${port}`));
