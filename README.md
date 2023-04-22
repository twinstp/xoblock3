The former code at https://github.com/xoxo-extensions/nullo-killer/blob/main/content.js provided a solution to filter out spam posts on an Altair-style "web 1.0" text-based forum. Specifically, it targeted spam posts that consisted of repetitively pasted long posts that were difficult for users to scroll past. The approach used by the former code involved defining a list of known spam substrings (nulloSubstrings) and checking each post on the forum to see if it contained any of these substrings. If a post contained a substring from the list, it was hidden from the view of users. The code also included utility functions like isAllWhitespace and extractText to assist in processing the post text.

The new code provided in the question builds upon this prior art by introducing data structures and algorithms that allow for more flexible and efficient filtering. The new code uses a combination of probabilistic data structures like XOR filters and Bloom filters, as well as trie-based data structures, to allow for efficient substring search and spam filtering. The new code also utilizes hashing functions and LRU cache to improve performance.

Here's how the new code works:

Instead of relying on a fixed list of spam substrings, the new code uses XOR filters and Bloom filters to dynamically build and maintain a filter for spam detection. These probabilistic data structures allow for fast membership testing and can help identify spam posts based on defined patterns (e.g., common substrings, hashes, or features).

The XORFilter class allows the creation of an XOR filter that can be used to check if a given element may be a member of a set. This is done by initializing the filter with an array of keys (potentially extracted from spam posts) and using the mayContain method to test if a post contains any of these keys.

Similarly, the BloomFilter class allows the creation of a Bloom filter for membership testing. The class provides methods to add elements to the filter and check for membership. This can be used to filter out posts with known spam content or patterns.

The TrieNode class implements a Trie data structure for efficiently storing and searching strings. This can be used to build a trie of known spam patterns or substrings and efficiently search for their presence in the posts.

The LRUCache class implements a Least Recently Used (LRU) cache to store and retrieve key-value pairs. This can be used to cache search results or other intermediate data to speed up the filtering process.

Utility functions like escapeRegexSpecialCharacters, fuzzyMatch, getPostElements, and others are used for various purposes such as escaping special characters, fuzzy matching for approximate string search, and extracting post elements from the forum's HTML.

The combination of these data structures, algorithms, and utility functions allows the new code to efficiently filter out spam posts on the forum without relying on a fixed list of substrings. The new code can be adapted to handle various types of spam content, including those that do not rely on exact substring matches, and can be updated dynamically based on the evolving patterns of spam.

Overall, the new code provides a more robust, flexible, and efficient solution to the problem of spam filtering on a text-based forum, compared to the prior art of substring-based filtering.


From a signal detection perspective, the goal of spam filtering is to accurately identify and filter out spam posts while minimizing the number of false positives (legitimate posts incorrectly classified as spam) and false negatives (spam posts not detected). To achieve this, the spam filtering solution must balance sensitivity (ability to detect true positives) and specificity (ability to reject false positives). The use of probabilistic data structures like XOR filters and Bloom filters inherently involves a trade-off between false positives and false negatives. These filters provide fast membership testing but may yield false positives, indicating that an element is a member of the set even when it is not. However, false negatives are not possible with these filters. The choice of parameters, such as the filter size, hash functions, and number of hash functions, affects this trade-off.

Efficiencies in terms of operations and caching are achieved through several mechanisms:

XOR filters and Bloom filters provide constant-time membership testing regardless of the size of the set. This allows for quick detection of spam posts based on predefined patterns.

A trie-based data structure enables efficient substring search by eliminating the need to search for substrings in the entire text of each post. The trie allows for prefix-based search, which is more efficient than a linear search for substrings.

The use of an LRU cache allows for caching of intermediate data and search results. This reduces the need for repeated computations, especially for frequently occurring patterns or substrings.

The use of hashing functions such as SHA-1 provides a compact representation of data, allowing for efficient comparison and lookup.