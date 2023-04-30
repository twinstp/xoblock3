
// ## DATA STRUCTURES ##
function makeCharTable(str) {
	const MAX_CHAR = 256;
	const table = Array(MAX_CHAR).fill(-1);
	for (let i = 0; i < str.length; i++) {
		table[str.charCodeAt(i)] = i;
	}

	return table;
}

function boyerMoore(text, pattern) {
	const charTable = makeCharTable(pattern);
	const offsetTable = makeOffsetTable(pattern);
	for (let i = pattern.length - 1, j; i < text.length;) {
		for (j = pattern.length - 1; pattern[j] === text[i]; i--, j--) {
			if (j === 0) {
				return i;
			}
		}

		i += Math.max(
			offsetTable[pattern.length - 1 - j],
			charTable[text.charCodeAt(i)],
		);
	}

	return -1;
}

function makeOffsetTable(pattern) {
	const table = Array(pattern.length).fill(0);
	let lastPrefixIndex = pattern.length - 1;

	for (let i = pattern.length - 1; i >= 0; i--) {
		if (isPrefix(pattern, i + 1)) {
			lastPrefixIndex = i + 1;
		}

		table[pattern.length - 1 - i] = lastPrefixIndex - i + pattern.length - 1;
	}

	for (let i = 0; i < pattern.length - 1; i++) {
		const suffixLen = suffixLength(pattern, i);
		table[suffixLen] = pattern.length - 1 - i + suffixLen;
	}

	return table;
}

function isPrefix(pattern, p) {
	for (let i = p, j = 0; i < pattern.length; i++, j++) {
		if (pattern[i] !== pattern[j]) {
			return false;
		}
	}

	return true;
}

function suffixLength(pattern, p) {
	let len = 0;
	for (let i = p, j = pattern.length - 1; pattern[i] === pattern[j]; i--, j--) {
		len += 1;
	}

	return len;
}

class XORFilter {
	constructor(keys, seed = 123456789) {
		console.log('Creating XORFilter...');
		this.fingerprintSize = 8;
		this.hashes = 3;
		this.seed = seed;
		this.size = keys.length;
		this.arrayLength = this.getArrayLength(this.size);
		this.blockLength = Math.floor(this.arrayLength / this.hashes);
		this.fingerprints = new Uint8Array(this.arrayLength);
		this.initialize(keys);
	}

	getArrayLength(size) {
		const offset = 32;
		const factorTimes100 = 123;
		return Math.floor(offset + (factorTimes100 * size) / 100);
	}

	hash(key, index) {
		const r = ((key + this.seed) << (21 * index)) >>> 0;
		return (r % this.blockLength) + index * this.blockLength;
	}

	fingerprint(hash) {
		return hash & ((1 << this.fingerprintSize) - 1);
	}

	initialize(keys) {
		console.log('Initializing XORFilter...');
		const t2count = new Uint8Array(this.arrayLength);
		const t2 = new Uint32Array(this.arrayLength);
		keys.forEach(key => {
			if (typeof key !== 'number') {
				console.warn(`Invalid key type: ${typeof key}. Key must be a number.`);
				return;
			}

			for (let hi = 0; hi < this.hashes; hi++) {
				const h = this.hash(key, hi);
				t2[h] ^= key;
				t2count[h]++;
			}
		});

		const alone = Array.from({ length: this.hashes }, () => new Set());
		for (let nextAlone = 0; nextAlone < this.hashes; nextAlone++) {
			for (let i = 0; i < this.blockLength; i++) {
				if (t2count[nextAlone * this.blockLength + i] === 1) {
					alone[nextAlone].add(nextAlone * this.blockLength + i);
				}
			}
		}

		const reverseOrder = [];
		const reverseH = [];

		while (true) {
			let found = -1;
			let i = -1;
			for (let hi = 0; hi < this.hashes; hi++) {
				if (alone[hi].size > 0) {
					i = alone[hi].values().next().value;
					alone[hi].delete(i);
					found = hi;
					break;
				}
			}

			if (i === -1) {
				break;
			}

			if (t2count[i] <= 0) {
				continue;
			}

			const k = t2[i];
			t2count[i]--;

			for (let hi = 0; hi < this.hashes; hi++) {
				if (hi !== found) {
					const h = this.hash(k, hi);
					t2count[h]--;
					t2[h] ^= k;
					if (t2count[h] === 1) {
						alone[hi].add(h);
					}
				}
			}

			reverseOrder.push(k);
			reverseH.push(found);
		}

		for (let i = reverseOrder.length - 1; i >= 0; i--) {
			const k = reverseOrder[i];
			const found = reverseH[i];
			let change = -1;
			let xor = this.fingerprint(k);
			for (let hi = 0; hi < this.hashes && change === -1; hi++) {
				const h = this.hash(k, hi);
				if (found === hi) {
					change = h;
				} else {
					xor ^= this.fingerprints[h];
				}
			}

			this.fingerprints[change] = xor;
		}

		console.log('XORFilter initialized.');
	}

	mayContain(key) {
		const hash = key + this.seed;
		let f = this.fingerprint(hash);
		const h0 = this.hash(key, 0);
		const h1 = this.hash(key, 1);
		const h2 = this.hash(key, 2);
		f ^= this.fingerprints[h0] ^ this.fingerprints[h1] ^ this.fingerprints[h2];
		return (f & 0xff) === 0;
	}
}

class BloomFilter {
	constructor(size, numHashes) {
		console.log('Creating BloomFilter...');
		this.size = size;
		this.numHashes = numHashes;
		this.bits = new Uint8Array(Math.floor(size / 8));
		this.seed = 12345;
	}

	checkAndAdd(element) {
		console.log(`BloomFilter checking and adding element: ${element}`);
		if (!element || typeof element !== 'string') {
			console.warn('Invalid element: Must be a non-empty string.');
			return false;
		}

		let exists = true;
		for (let i = 0; i < this.numHashes; i++) {
			const hashIdx = this.hash(element, i);
			if ((this.bits[hashIdx >> 5] & (1 << (hashIdx & 31))) === 0) {
				exists = false;
			}

			this.bits[hashIdx >> 5] |= 1 << (hashIdx & 31);
		}

		return exists;
	}

	hash(element, hashIndex) {
		if (!element || element.length === 0) {
			return 0;
		}

		let hash = this.seed * hashIndex;
		for (const char of [...element]) {
			hash = hash * this.seed + char.charCodeAt(0);
		}

		return hash % this.size;
	}

	isFull() {
		for (let i = 0; i < this.bits.length; i++) {
			if (~this.bits[i]) {
				return false;
			}
		}

		return true;
	}

	keys() {
		const keys = [];
		for (let i = 0; i < this.bits.length; i++) {
			for (let bit = 0; bit < 8; bit++) {
				if (this.bits[i] & (1 << bit)) {
					keys.push(i * 8 + bit);
				}
			}
		}

		return keys;
	}

	clear() {
		this.bits = new Uint8Array(this.bits.length);
	}
}
class ListNode {
	constructor(key, value) {
		this.key = key;
		this.value = value;
		this.prev = null;
		this.next = null;
	}
}

class LRUCache {
	constructor(capacity) {
		if (typeof capacity !== 'number' || capacity <= 0) {
			throw new Error('Invalid capacity: Must be a positive number.');
		}

		this.capacity = capacity;
		this.cache = new Map();
		this.head = new ListNode(null, null);
		this.tail = new ListNode(null, null);
		this.head.next = this.tail;
		this.tail.prev = this.head;
	}

	get(key) {
		if (!this.cache.has(key)) {
			return null;
		}

		const node = this.cache.get(key);
		this.moveToHead(node);
		return node.value;
	}

	put(key, value) {
		if (this.cache.has(key)) {
			const node = this.cache.get(key);
			node.value = value;
			this.moveToHead(node);
		} else {
			const node = new ListNode(key, value);
			this.cache.set(key, node);
			this.addToHead(node);
			if (this.cache.size > this.capacity) {
				this.cache.delete(this.tail.prev.key);
				this.removeFromTail();
			}
		}
	}

	moveToHead(node) {
		this.removeFromList(node);
		this.addToHead(node);
	}

	addToHead(node) {
		node.prev = this.head;
		node.next = this.head.next;
		this.head.next.prev = node;
		this.head.next = node;
	}

	removeFromList(node) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
	}

	removeFromTail() {
		this.removeFromList(this.tail.prev);
	}

	getKeys() {
		return Array.from(this.cache.keys());
	}
}

class TrieNode {
	constructor() {
		this.children = new Map();
		this.isEndOfWord = false;
	}

	insert(word) {
		if (!word || typeof word !== 'string') {
			console.warn('Invalid word: Must be a non-empty string.');
			return;
		}

		let current = this;
		for (const ch of word) {
			if (!current.children.has(ch)) {
				current.children.set(ch, new TrieNode());
			}

			current = current.children.get(ch);
		}

		current.isEndOfWord = true;
	}

	search(word) {
		if (!word || typeof word !== 'string') {
			console.warn('Invalid word: Must be a non-empty string.');
			return false;
		}

		let current = this;
		for (const ch of word) {
			if (!current.children.has(ch)) {
				return false;
			}

			current = current.children.get(ch);
		}

		return current.isEndOfWord;
	}
}

function utf8_encode(str) {
	if (!str || typeof str !== 'string') {
		console.warn('Invalid string: Must be a non-empty string.');
		return '';
	}

	return unescape(encodeURIComponent(str));
}

class SimHashUtil {
	static createSHA1Hash(message) {
		// SHA1 implementation [do not touch]
		function sha1(f) {
			let $;
			let r;
			let e;
			let o;
			let t;
			let _;
			let x;
			let a;
			let h;
			const c = function (f, $) {
				return (f << $) | (f >>> (32 - $));
			};

			const C = function (f) {
				let $;
				let r;
				let e = '';
				for ($ = 7; $ >= 0; $--) {
					e += (r = (f >>> (4 * $)) & 15).toString(16);
				}

				return e;
			};

			const A = Array(80);
			let n = 1732584193;
			let s = 4023233417;
			let u = 2562383102;
			let d = 271733878;
			let i = 3285377520;
			const D = (f = utf8_encode(f)).length;
			const p = [];
			for (r = 0; r < D - 3; r += 4) {
				(e
					= (f.charCodeAt(r) << 24)
					| (f.charCodeAt(r + 1) << 16)
					| (f.charCodeAt(r + 2) << 8)
					| f.charCodeAt(r + 3)),
					p.push(e);
			}

			switch (D % 4) {
				case 0:
					r = 2147483648;
					break;
				case 1:
					r = (f.charCodeAt(D - 1) << 24) | 8388608;
					break;
				case 2:
					r = (f.charCodeAt(D - 2) << 24) | (f.charCodeAt(D - 1) << 16) | 32768;
					break;
				case 3:
					r
						= (f.charCodeAt(D - 3) << 24)
						| (f.charCodeAt(D - 2) << 16)
						| (f.charCodeAt(D - 1) << 8)
						| 128;
			}

			for (p.push(r); p.length % 16 != 14;) {
				p.push(0);
			}

			for (
				p.push(D >>> 29), p.push((D << 3) & 4294967295), $ = 0;
				$ < p.length;
				$ += 16
			) {
				for (r = 0; r < 16; r++) {
					A[r] = p[$ + r];
				}

				for (r = 16; r <= 79; r++) {
					A[r] = c(A[r - 3] ^ A[r - 8] ^ A[r - 14] ^ A[r - 16], 1);
				}

				for (r = 0, o = n, t = s, _ = u, x = d, a = i; r <= 19; r++) {
					(h
						= (c(o, 5) + ((t & _) | (~t & x)) + a + A[r] + 1518500249)
						& 4294967295),
						(a = x),
						(x = _),
						(_ = c(t, 30)),
						(t = o),
						(o = h);
				}

				for (r = 20; r <= 39; r++) {
					(h = (c(o, 5) + (t ^ _ ^ x) + a + A[r] + 1859775393) & 4294967295),
						(a = x),
						(x = _),
						(_ = c(t, 30)),
						(t = o),
						(o = h);
				}

				for (r = 40; r <= 59; r++) {
					(h
						= (c(o, 5) + ((t & _) | (t & x) | (_ & x)) + a + A[r] + 2400959708)
						& 4294967295),
						(a = x),
						(x = _),
						(_ = c(t, 30)),
						(t = o),
						(o = h);
				}

				for (r = 60; r <= 79; r++) {
					(h = (c(o, 5) + (t ^ _ ^ x) + a + A[r] + 3395469782) & 4294967295),
						(a = x),
						(x = _),
						(_ = c(t, 30)),
						(t = o),
						(o = h);
				}

				(n = (n + o) & 4294967295),
					(s = (s + t) & 4294967295),
					(u = (u + _) & 4294967295),
					(d = (d + x) & 4294967295),
					(i = (i + a) & 4294967295);
			}

			return (h = C(n) + C(s) + C(u) + C(d) + C(i)).toLowerCase();
		}

		// Invoke the sha1 function and return the result
		return sha1(message);
	}

	static async simhash(message) {
		const hexDigest = this.createSHA1Hash(message);
		const bitString = hexDigest
			.split('')
			.map(char => parseInt(char, 16).toString(2).padStart(4, '0'))
			.join('');
		const hash = [];
		for (let i = 0; i < bitString.length; i += 8) {
			hash.push(parseInt(bitString.substr(i, 8), 2));
		}

		return hash;
	}

	static countSetBits(num) {
		let count = 0;
		while (num) {
			count += num & 1;
			num >>= 1;
		}

		return count;
	}

	static hammingDistance(hash1, hash2) {
		if (hash1.length !== hash2.length) {
			throw new Error('The lengths of hash1 and hash2 must be equal.');
		}

		let distance = 0;
		for (let i = 0; i < hash1.length; i++) {
			const binary1 = hash1[i].toString(2).padStart(8, '0');
			const binary2 = hash2[i].toString(2).padStart(8, '0');
			for (let j = 0; j < binary1.length; j++) {
				if (binary1[j] !== binary2[j]) {
					distance++;
				}
			}
		}

		return distance;
	}
}
(async () => {
	try {
		const hash1 = await SimHashUtil.simhash('Hello, World!');
		const hash2 = await SimHashUtil.simhash('Goodbye, World!');
		const distance = SimHashUtil.hammingDistance(hash1, hash2);
		console.log(distance);
	} catch (err) {
		console.error(err);
	}
})();

class ConfigurationManager {
	constructor() {
		this.config = this.getInitialConfig();
		this.loadConfig();
	}

	// Define DEFAULT_CONFIG as a static property of the class
	static DEFAULT_CONFIG = {
		MAX_CACHE_SIZE: 5000,
		MAX_HAMMING_DISTANCE: 5,
		LONG_POST_THRESHOLD: 1000,
		SIGNATURE_THRESHOLD: 100,
		FILTERED_SUBSTRINGS: [
			'modification, and he recently agreed to answer our questions',
			'legal efforts to overturn the 2020 election; and three offenses relating to Trump’s unlawful possession of government records at Mar-a-Lago',
			'America is in the midst of the Cold War. The masculine fire and fury of World War II has given way to a period of cooling',
			'Go to the link, and look at that woman. Look at that face. She never expressed any remorse over',
			'destroyed the Ancien Regime in Europe, was an economic and scientific golden era, but politically it was a mess.',
		],
		USER_HIDDEN_AUTHORS: [],
	};

	getInitialConfig() {
		return ConfigurationManager.DEFAULT_CONFIG;
	}

	async loadConfig() {
		console.log('Loading config...');
		return new Promise((resolve, reject) => {
			chrome.storage.local.get('config', storedData => {
				if (chrome.runtime.lastError) {
					console.error(chrome.runtime.lastError);
					reject(chrome.runtime.lastError);
				} else {
					this.config = storedData?.config || this.getInitialConfig();
					resolve(this.config);
				}
			});
		});
	}

	saveConfig(newConfig) {
		chrome.storage.local.set(
			{
				config: newConfig,
			},
			() => {
				console.log('Configuration updated:', newConfig);
				alert('Configuration saved successfully.');
			},
		);
	}
}

class PostParserError extends Error {
	constructor(message) {
		super(message);
		this.name = 'PostParserError';
	}
}

class PostParser {
	isAllWhitespace(text) {
		return /^\s*$/.test(text);
	}

	extractText(input) {
		const regex
			= /\(http:\/\/www\.autoadmit\.com\/thread\.php\?thread_id=\d+&forum_id=\d+#\d+\)$/;
		return input.replace(regex, '').replace(/^\)/, '').trim();
	}

	extractResponses(
		parent,
		parentResponseId = null,
		visitedNodes = new Set(),
		outline = [],
	) {
		console.log('Extracting responses...');
		const responseEntries = [];

		parent.querySelectorAll('a[href^="#"]').forEach(anchor => {
			const responseId = anchor.getAttribute('href').slice(1);
			if (!visitedNodes.has(responseId)) {
				visitedNodes.add(responseId);
				const response = document.getElementById(responseId);
				const responseText = this.extractText(response.innerText);

				if (!this.isAllWhitespace(responseText)) {
					responseEntries.push({
						parent: parentResponseId,
						id: responseId,
						text: responseText,
						// Added
						author: response.querySelector('.post_author').innerText.trim(),
					});
					outline.push(responseId);

					const nestedResponses = this.extractResponses(
						response,
						responseId,
						visitedNodes,
						outline,
					);

					if (nestedResponses.length > 0) {
						responseEntries.push(...nestedResponses);
					}
				}
			}
		});

		return responseEntries;
	}

	getPostElements() {
		console.log('getPostElements: Start');
		const postTables = document.querySelectorAll('table[width="700"]');
		console.log(`getPostElements: Found ${postTables.length} post tables`);

		const posts = Array.from(postTables).map((table, index) => {
			console.log(`getPostElements: Processing post table ${index + 1}`);
			const responseNameElement = table.querySelector('a[name]');
			const responseName = responseNameElement
				? responseNameElement.name
				: null;
			console.log(
				`getPostElements: Response name for post table ${index + 1
				} is ${responseName}`,
			);
			if (responseName === 'Top') {
				console.log(
					`getPostElements: Skipping post table ${index + 1
					} because response name is 'Top'`,
				);
				return null;
			}

			const fontTag = table.querySelector('font[face="Times New Roman"]');
			if (fontTag) {
				const fontText = fontTag.innerText.trim();
				const dateStr = fontText.match(/Date:\s*(.*?)\s*Author:/)[1];
				console.log(
					`getPostElements: Date string for post table ${index + 1
					} is ${dateStr}`,
				);

				const author = fontText.match(/Author:\s*(.*?)\s*\n/)[1];
				console.log(
					`getPostElements: Author for post table ${index + 1} is ${author}`,
				);

				let content = fontText.replace(/Date:.*Author:\s*/, '').trim();
				const selfRefLinkMatch = content.match(
					/\(http:\/\/www\.autoadmit\.com\/[^\)]+\)/,
				);
				const selfRefLink = selfRefLinkMatch
					? selfRefLinkMatch[0].replace(/[\(\)]/g, '')
					: null;
				console.log(
					`getPostElements: Self reference link for post table ${index + 1
					} is ${selfRefLink}`,
				);

				if (selfRefLink) {
					content = content.replace(selfRefLink, '').trim();
				}

				content = content
					.replace('Date:', '')
					.replace(dateStr, '', 1)
					.replace('Author:', '')
					.replace(author, '', 1)
					.trim();
				console.log(
					`getPostElements: Content for post table ${index + 1} is '${content}'`,
				);

				const parentLinkElement = table.querySelector('a[href^="#"]');
				const parentResponseName = parentLinkElement
					? parentLinkElement.href.slice(1)
					: null;
				console.log(
					`getPostElements: Parent response name for post table ${index + 1
					} is ${parentResponseName}`,
				);

				return {
					date: dateStr,
					author,
					content,
					responseName,
					selfRefLink,
					parentResponseName,
					postTable: table,
				};
			}

			console.log(
				`getPostElements: Skipping post table ${index + 1
				} because no font tag found`,
			);
			return null;
		});

		const nonNullPosts = posts.filter(post => post !== null);
		console.log(
			`getPostElements: Returning ${nonNullPosts.length} non-null posts`,
		);
		return nonNullPosts;
	}

	parsePost(postElement) {
		console.log('Parsing post...');

		const post = postElement.querySelector('.topic-post');
		if (!post) {
			throw new PostParserError('Post element does not contain a .topic-post');
		}

		const postText = this.extractText(post.innerText);
		if (this.isAllWhitespace(postText)) {
			throw new PostParserError('Post text is all whitespace');
		}

		const postAuthor = post.querySelector('.post_author').innerText.trim();
		const postResponses = this.extractResponses(post);

		return {
			postAuthor,
			postText,
			postResponses,
		};
	}
}

class SubstringSearch {
	constructor(config) {
		this.config = config;
		this.trie = new TrieNode();
		this.initializeFilters();
	}

	initializeFilters() {
		for (const substring of this.config.FILTERED_SUBSTRINGS) {
			this.trie.insert(substring);
		}
	}

	containsSpamSubstring(text) {
		for (const substring of this.config.FILTERED_SUBSTRINGS) {
			if (text.includes(substring)) {
				return true;
			}
		}

		return false;
	}
}

class AuthorSearch {
	constructor(config) {
		this.config = config;
		this.trie = new TrieNode();
		this.initializeFilters();
	}

	initializeFilters() {
		for (const author of this.config.USER_HIDDEN_AUTHORS) {
			this.trie.insert(author);
		}
	}

	isSpamAuthor(author) {
		return this.config.USER_HIDDEN_AUTHORS.includes(author);
	}
}

class FilterManager {
	constructor(config) {
		this.config = config;
		this.substringSearch = new SubstringSearch(config);
		this.authorSearch = new AuthorSearch(config);
		this.lruCache = new LRUCache(config.MAX_CACHE_SIZE);
		this.bloomFilter = new BloomFilter(config.BLOOM_FILTER_SIZE, config.NUM_HASHES);
		this.xorFilter = new XORFilter([]);
		this.signatureThreshold = config.SIGNATURE_THRESHOLD || 100;
		this.initializeFilters();
	}

	initializeFilters() {
		console.log('Initializing filters...');
		this.substringSearch.initializeFilters();
		this.authorSearch.initializeFilters();
		this.xorFilter = new XORFilter([]);
	}

	collectAndCheckSignature(signature) {
		this.bloomFilter.checkAndAdd(signature);
		if (this.bloomFilter.isFull()) {
			this.xorFilter = new XORFilter(Array.from(this.bloomFilter.keys()));
			this.bloomFilter.clear();
		}
	}
}

class ContentFilter {
	constructor() {
		console.log('Initializing ContentFilter...');
		this.configManager = new ConfigurationManager();
		this.postParser = new PostParser();
		this.filterManager = new FilterManager(this.configManager.config);
		this.filterPosts();
	}

	filterPosts() {
		console.log('Running filterPosts...');
		const posts = this.postParser.getPostElements();
		posts.forEach(({ content, postTable, id }) => {
			if (this.filterManager.substringSearch.containsSpamSubstring(content)) {
				console.log(`Filtering post with ID: ${id}`);
				this.hidePost(postTable);
			}
		});
	}

	hidePost(postTable) {
		console.log('Hiding post completely...');
		if (postTable) {
			postTable.style.display = 'none';
		} else {
			console.error('Cannot hide post: postTable is undefined');
		}
	}

	filterPostsByAuthor() {
		console.log('Running filterPostsByAuthor...');
		const posts = this.postParser.getPostElements();
		posts.forEach(({ author, postTable, id }) => {
			if (this.filterManager.authorSearch.isSpamAuthor(author)) {
				console.log(`Filtering post with ID: ${id} by author: ${author}`);
				this.hidePost(postTable);
			}
		});
	}

	async filterSpamPostsBySimHash() {
		console.log('Running filterSpamPostsBySimHash...');
		const posts = this.postParser.getPostElements();
		const longPosts = posts.filter(
			post =>
				post.content.length >= this.filterManager.config.LONG_POST_THRESHOLD,
		);
		const simHashPromises = longPosts.map(post =>
			SimHashUtil.simhash(post.content),
		);
		const simHashes = await Promise.all(simHashPromises);
		for (let i = 0; i < longPosts.length; i++) {
			const post = longPosts[i];
			const simHash = simHashes[i];
			const isSpam = this.filterManager.lruCache
				.getKeys()
				.some(
					cachedSimHash =>
						SimHashUtil.hammingDistance(simHash, cachedSimHash)
						<= this.filterManager.config.MAX_HAMMING_DISTANCE,
				) || this.filterManager.xorFilter.mayContain(simHash);
			if (isSpam) {
				console.log(`Filtering spam post with ID: ${post.id}`);
				this.hidePost(post.postTable);
				this.filterManager.collectAndCheckSignature(simHash);
			} else {
				this.filterManager.lruCache.put(simHash, true);
			}
		}
	}

	createSpoiler(content) {
		console.log(`Creating spoiler for content: ${content}`);
		const spoiler = document.createElement('div');
		spoiler.textContent = 'This post has been hidden due to potential spam.';
		spoiler.style.backgroundColor = '#ffcccc';
		spoiler.style.border = '1px solid red';
		spoiler.style.padding = '10px';
		return spoiler;
	}

	handleErrors(error) {
		console.error('Error:', error);
	}
}

window.onload = () => {
	new ContentFilter();
};
