export type DsaDifficulty = 'Easy' | 'Medium' | 'Hard';

export type DsaQuestion = {
  id: number;
  title: string;
  difficulty: DsaDifficulty;
  topic: string;
  companies: string[];
  estimatedTime: number;
  solved: boolean;
};

export const dsaQuestions: DsaQuestion[] = [
  { id: 1, title: 'Two Sum', difficulty: 'Easy', topic: 'Arrays', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 15, solved: true },
  { id: 2, title: 'Best Time to Buy and Sell Stock', difficulty: 'Easy', topic: 'Arrays', companies: ['Amazon', 'Meta', 'Bloomberg'], estimatedTime: 20, solved: true },
  { id: 3, title: 'Valid Parentheses', difficulty: 'Easy', topic: 'Stack', companies: ['Google', 'Microsoft', 'Adobe'], estimatedTime: 15, solved: true },
  { id: 4, title: 'Merge Two Sorted Lists', difficulty: 'Easy', topic: 'Linked List', companies: ['Amazon', 'Apple', 'Microsoft'], estimatedTime: 20, solved: false },
  { id: 5, title: 'Maximum Subarray', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'LinkedIn', 'Meta'], estimatedTime: 25, solved: true },
  { id: 6, title: 'Climbing Stairs', difficulty: 'Easy', topic: 'Dynamic Programming', companies: ['Adobe', 'Google', 'Uber'], estimatedTime: 15, solved: true },
  { id: 7, title: 'Product of Array Except Self', difficulty: 'Medium', topic: 'Arrays', companies: ['Meta', 'Amazon', 'Apple'], estimatedTime: 30, solved: false },
  { id: 8, title: 'Container With Most Water', difficulty: 'Medium', topic: 'Two Pointers', companies: ['Google', 'Amazon', 'Bloomberg'], estimatedTime: 30, solved: false },
  { id: 9, title: '3Sum', difficulty: 'Medium', topic: 'Two Pointers', companies: ['Meta', 'Microsoft', 'Adobe'], estimatedTime: 35, solved: false },
  { id: 10, title: 'Search in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', companies: ['Amazon', 'Google', 'LinkedIn'], estimatedTime: 30, solved: true },
  { id: 11, title: 'Find Minimum in Rotated Sorted Array', difficulty: 'Medium', topic: 'Binary Search', companies: ['Microsoft', 'Amazon', 'Uber'], estimatedTime: 25, solved: false },
  { id: 12, title: 'Kth Largest Element in an Array', difficulty: 'Medium', topic: 'Heap', companies: ['Amazon', 'Meta', 'Apple'], estimatedTime: 30, solved: false },
  { id: 13, title: 'Top K Frequent Elements', difficulty: 'Medium', topic: 'Heap', companies: ['Google', 'Amazon', 'Yelp'], estimatedTime: 30, solved: true },
  { id: 14, title: 'Group Anagrams', difficulty: 'Medium', topic: 'Hash Table', companies: ['Amazon', 'Meta', 'Uber'], estimatedTime: 25, solved: true },
  { id: 15, title: 'Longest Substring Without Repeating Characters', difficulty: 'Medium', topic: 'Sliding Window', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 30, solved: true },
  { id: 16, title: 'Minimum Window Substring', difficulty: 'Hard', topic: 'Sliding Window', companies: ['Google', 'Meta', 'Uber'], estimatedTime: 45, solved: false },
  { id: 17, title: 'Number of Islands', difficulty: 'Medium', topic: 'Graphs', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 35, solved: false },
  { id: 18, title: 'Clone Graph', difficulty: 'Medium', topic: 'Graphs', companies: ['Meta', 'Google', 'Apple'], estimatedTime: 35, solved: false },
  { id: 19, title: 'Course Schedule', difficulty: 'Medium', topic: 'Graphs', companies: ['Amazon', 'DoorDash', 'Uber'], estimatedTime: 35, solved: true },
  { id: 20, title: 'Word Ladder', difficulty: 'Hard', topic: 'Graphs', companies: ['Amazon', 'Google', 'LinkedIn'], estimatedTime: 50, solved: false },
  { id: 21, title: 'Binary Tree Inorder Traversal', difficulty: 'Easy', topic: 'Trees', companies: ['Microsoft', 'Amazon', 'Bloomberg'], estimatedTime: 20, solved: true },
  { id: 22, title: 'Binary Tree Level Order Traversal', difficulty: 'Medium', topic: 'Trees', companies: ['Amazon', 'Meta', 'Google'], estimatedTime: 30, solved: true },
  { id: 23, title: 'Validate Binary Search Tree', difficulty: 'Medium', topic: 'Trees', companies: ['Amazon', 'Microsoft', 'Apple'], estimatedTime: 30, solved: false },
  { id: 24, title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'Medium', topic: 'Trees', companies: ['Meta', 'Amazon', 'LinkedIn'], estimatedTime: 35, solved: false },
  { id: 25, title: 'Serialize and Deserialize Binary Tree', difficulty: 'Hard', topic: 'Trees', companies: ['Google', 'Amazon', 'Meta'], estimatedTime: 55, solved: false },
  { id: 26, title: 'Implement Trie', difficulty: 'Medium', topic: 'Trie', companies: ['Google', 'Amazon', 'Microsoft'], estimatedTime: 35, solved: false },
  { id: 27, title: 'Word Search II', difficulty: 'Hard', topic: 'Trie', companies: ['Amazon', 'Airbnb', 'Google'], estimatedTime: 55, solved: false },
  { id: 28, title: 'Coin Change', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'Google', 'Uber'], estimatedTime: 35, solved: true },
  { id: 29, title: 'Longest Increasing Subsequence', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Google', 'Meta', 'Microsoft'], estimatedTime: 40, solved: false },
  { id: 30, title: 'Edit Distance', difficulty: 'Hard', topic: 'Dynamic Programming', companies: ['Google', 'Microsoft', 'Amazon'], estimatedTime: 55, solved: false },
  { id: 31, title: 'House Robber', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Amazon', 'LinkedIn', 'Adobe'], estimatedTime: 25, solved: true },
  { id: 32, title: 'Decode Ways', difficulty: 'Medium', topic: 'Dynamic Programming', companies: ['Meta', 'Amazon', 'TikTok'], estimatedTime: 30, solved: false },
  { id: 33, title: 'Longest Palindromic Substring', difficulty: 'Medium', topic: 'Strings', companies: ['Amazon', 'Microsoft', 'Bloomberg'], estimatedTime: 35, solved: false },
  { id: 34, title: 'Valid Palindrome', difficulty: 'Easy', topic: 'Strings', companies: ['Meta', 'Microsoft', 'Apple'], estimatedTime: 15, solved: true },
  { id: 35, title: 'String to Integer Atoi', difficulty: 'Medium', topic: 'Strings', companies: ['Amazon', 'Google', 'Adobe'], estimatedTime: 30, solved: false },
  { id: 36, title: 'Palindromic Substrings', difficulty: 'Medium', topic: 'Strings', companies: ['Meta', 'Amazon', 'Apple'], estimatedTime: 30, solved: false },
  { id: 37, title: 'Subsets', difficulty: 'Medium', topic: 'Backtracking', companies: ['Amazon', 'Meta', 'Google'], estimatedTime: 25, solved: true },
  { id: 38, title: 'Combination Sum', difficulty: 'Medium', topic: 'Backtracking', companies: ['Amazon', 'Microsoft', 'Uber'], estimatedTime: 35, solved: false },
  { id: 39, title: 'Permutations', difficulty: 'Medium', topic: 'Backtracking', companies: ['LinkedIn', 'Amazon', 'Adobe'], estimatedTime: 30, solved: false },
  { id: 40, title: 'N-Queens', difficulty: 'Hard', topic: 'Backtracking', companies: ['Google', 'Amazon', 'Bloomberg'], estimatedTime: 55, solved: false },
  { id: 41, title: 'Merge Intervals', difficulty: 'Medium', topic: 'Intervals', companies: ['Google', 'Meta', 'Amazon'], estimatedTime: 25, solved: true },
  { id: 42, title: 'Insert Interval', difficulty: 'Medium', topic: 'Intervals', companies: ['Google', 'LinkedIn', 'Microsoft'], estimatedTime: 30, solved: false },
  { id: 43, title: 'Meeting Rooms II', difficulty: 'Medium', topic: 'Intervals', companies: ['Amazon', 'Meta', 'Bloomberg'], estimatedTime: 35, solved: false },
  { id: 44, title: 'Trapping Rain Water', difficulty: 'Hard', topic: 'Two Pointers', companies: ['Amazon', 'Google', 'Meta'], estimatedTime: 45, solved: false },
  { id: 45, title: 'LRU Cache', difficulty: 'Medium', topic: 'Design', companies: ['Amazon', 'Google', 'Microsoft'], estimatedTime: 40, solved: true },
  { id: 46, title: 'Design Add and Search Words Data Structure', difficulty: 'Medium', topic: 'Design', companies: ['Meta', 'Amazon', 'Uber'], estimatedTime: 40, solved: false },
  { id: 47, title: 'Median of Two Sorted Arrays', difficulty: 'Hard', topic: 'Binary Search', companies: ['Google', 'Amazon', 'Apple'], estimatedTime: 55, solved: false },
  { id: 48, title: 'Sliding Window Maximum', difficulty: 'Hard', topic: 'Queue', companies: ['Amazon', 'Google', 'DoorDash'], estimatedTime: 50, solved: false },
  { id: 49, title: 'Alien Dictionary', difficulty: 'Hard', topic: 'Graphs', companies: ['Airbnb', 'Google', 'Meta'], estimatedTime: 50, solved: false },
  { id: 50, title: 'Find Median from Data Stream', difficulty: 'Hard', topic: 'Heap', companies: ['Amazon', 'Google', 'Bloomberg'], estimatedTime: 45, solved: false }
];
