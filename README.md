Overview
The purpose of this program is to provide a content filtering solution for an online forum, specifically aimed at reducing spam and unwanted content. The filtering system comprises a browser extension that employs a combination of techniques such as substring matching, author-based filtering, and SimHash-based similarity detection to identify and filter out undesired posts.

The program consists of several classes and utilities that work together to achieve the goal of content filtering:

SimHashUtil: A utility class that provides methods for computing SimHash fingerprints of text content and calculating Hamming distances between SimHash fingerprints. It is used for similarity detection.

ConfigurationManager: A class responsible for managing configuration settings for the content filtering system. It handles the loading and saving of configuration data, and provides default values for settings such as maximum cache size, maximum Hamming distance, and long post threshold.

FilterManager: A class that manages different filtering techniques, including substring-based filtering, author-based filtering, and SimHash-based similarity filtering. It utilizes data structures such as trie, Bloom filter, XOR filter, and LRU cache to efficiently perform filtering operations.

PostParser: A class responsible for parsing the HTML content of forum pages and extracting relevant information about individual posts, including author, date, content, and unique ID. It also extracts the hierarchical structure of responses to posts.

ContentFilter: A class that orchestrates the filtering process. It initializes the ConfigurationManager, PostParser, and FilterManager, and applies filtering rules to the posts based on the configuration settings. It generates spoiler elements to replace filtered content and allows users to reveal the content if desired.

The program has a settings page that allows users to customize filtering parameters such as maximum cache size, maximum Hamming distance, long post threshold, and signature threshold. Users can also specify a list of filtered substrings and hidden authors.

Usage
Once installed as a browser extension, the content filtering system automatically filters posts in the online forum based on the user's configuration settings. The user can customize the filtering behavior through the extension's settings page. Filtered posts will be replaced with a spoiler element, allowing the user to reveal the content if desired.

Testing
The program includes a test function, testFilterPostsBySubstrings(), which simulates filtering behavior on a set of test posts. The function is called at the end of the script to verify the behavior of the filtering system based on substring matching.

Limitations
The program is designed to work with an older online forum that uses PHP and HTML without proper IDs or CSS classes for elements. As such, the HTML parsing relies on specific attributes and structures present in the forum's HTML content.

Contributing
Contributions and improvements to the code are welcome. Please follow the standard coding conventions and submit a pull request for review.
