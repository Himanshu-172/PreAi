export type SqlDifficulty = 'Easy' | 'Medium' | 'Hard';

export type SqlTopic =
  | 'SELECT'
  | 'WHERE'
  | 'GROUP BY'
  | 'HAVING'
  | 'JOIN'
  | 'INNER JOIN'
  | 'LEFT JOIN'
  | 'RIGHT JOIN'
  | 'FULL JOIN'
  | 'Subqueries'
  | 'CTE'
  | 'Window Functions'
  | 'Aggregate Functions'
  | 'Indexing'
  | 'Transactions';

export type SqlCompany =
  | 'Amazon'
  | 'Google'
  | 'Microsoft'
  | 'Meta'
  | 'Oracle'
  | 'Infosys'
  | 'TCS'
  | 'Accenture';

export type SqlQuestion = {
  id: number;
  title: string;
  difficulty: SqlDifficulty;
  topic: SqlTopic;
  companies: SqlCompany[];
  estimatedTime: number;
  solved: boolean;
  prompt: string;
  sampleTables: {
    name: string;
    columns: string[];
    rows: string[][];
  }[];
  expectedOutput: {
    columns: string[];
    rows: string[][];
  };
  explanation: string;
  hint: string;
  solution: string;
};

export const sqlTopics: SqlTopic[] = [
  'SELECT',
  'WHERE',
  'GROUP BY',
  'HAVING',
  'JOIN',
  'INNER JOIN',
  'LEFT JOIN',
  'RIGHT JOIN',
  'FULL JOIN',
  'Subqueries',
  'CTE',
  'Window Functions',
  'Aggregate Functions',
  'Indexing',
  'Transactions'
];

export const sqlCompanies: SqlCompany[] = [
  'Amazon',
  'Google',
  'Microsoft',
  'Meta',
  'Oracle',
  'Infosys',
  'TCS',
  'Accenture'
];

const employeesTable = {
  name: 'employees',
  columns: ['employee_id', 'name', 'department_id', 'salary', 'hire_date'],
  rows: [
    ['1', 'Asha', '10', '92000', '2021-04-12'],
    ['2', 'Ben', '20', '76000', '2022-01-08'],
    ['3', 'Chen', '10', '105000', '2020-09-19'],
    ['4', 'Diya', '30', '68000', '2023-02-03']
  ]
};

const departmentsTable = {
  name: 'departments',
  columns: ['department_id', 'department_name'],
  rows: [
    ['10', 'Engineering'],
    ['20', 'Sales'],
    ['30', 'Support'],
    ['40', 'Finance']
  ]
};

const ordersTable = {
  name: 'orders',
  columns: ['order_id', 'customer_id', 'order_date', 'amount', 'status'],
  rows: [
    ['101', '1', '2026-01-04', '240', 'paid'],
    ['102', '2', '2026-01-05', '180', 'paid'],
    ['103', '1', '2026-01-09', '90', 'refunded'],
    ['104', '3', '2026-01-12', '420', 'paid']
  ]
};

const customersTable = {
  name: 'customers',
  columns: ['customer_id', 'customer_name', 'city', 'signup_date'],
  rows: [
    ['1', 'Northwind Labs', 'Seattle', '2025-11-01'],
    ['2', 'Bluebird Retail', 'Austin', '2025-12-15'],
    ['3', 'Core Bank', 'New York', '2026-01-02'],
    ['4', 'Delta Health', 'Boston', '2026-01-10']
  ]
};

const paymentsTable = {
  name: 'payments',
  columns: ['payment_id', 'order_id', 'paid_at', 'amount'],
  rows: [
    ['9001', '101', '2026-01-04', '240'],
    ['9002', '102', '2026-01-06', '180'],
    ['9003', '104', '2026-01-12', '420']
  ]
};

const inventoryTable = {
  name: 'inventory',
  columns: ['sku', 'warehouse_id', 'quantity', 'updated_at'],
  rows: [
    ['A-100', '1', '18', '2026-02-01'],
    ['A-100', '2', '7', '2026-02-03'],
    ['B-200', '1', '0', '2026-02-02'],
    ['C-300', '3', '42', '2026-02-01']
  ]
};

export const sqlQuestions: SqlQuestion[] = [
  {
    id: 1,
    title: 'List employees hired after 2021',
    difficulty: 'Easy',
    topic: 'SELECT',
    companies: ['Infosys', 'TCS', 'Accenture'],
    estimatedTime: 10,
    solved: true,
    prompt: 'Return employee names and hire dates for employees hired on or after 2022-01-01.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['name', 'hire_date'], rows: [['Ben', '2022-01-08'], ['Diya', '2023-02-03']] },
    explanation: 'The query projects only the requested columns and filters rows by hire date.',
    hint: 'Use a date comparison in the WHERE clause.',
    solution: "SELECT name, hire_date\nFROM employees\nWHERE hire_date >= '2022-01-01';"
  },
  {
    id: 2,
    title: 'Find paid orders over 200',
    difficulty: 'Easy',
    topic: 'WHERE',
    companies: ['Amazon', 'Accenture', 'Oracle'],
    estimatedTime: 10,
    solved: true,
    prompt: 'Find order IDs and amounts where the order is paid and the amount is greater than 200.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['order_id', 'amount'], rows: [['101', '240'], ['104', '420']] },
    explanation: 'Both status and amount predicates must be true for a row to qualify.',
    hint: 'Combine predicates with AND.',
    solution: "SELECT order_id, amount\nFROM orders\nWHERE status = 'paid' AND amount > 200;"
  },
  {
    id: 3,
    title: 'Count orders per customer',
    difficulty: 'Easy',
    topic: 'GROUP BY',
    companies: ['Amazon', 'Microsoft', 'TCS'],
    estimatedTime: 15,
    solved: true,
    prompt: 'Return each customer ID and the number of orders they placed.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['customer_id', 'order_count'], rows: [['1', '2'], ['2', '1'], ['3', '1']] },
    explanation: 'Grouping by customer_id lets COUNT aggregate orders per customer.',
    hint: 'Use COUNT(*) with GROUP BY customer_id.',
    solution: 'SELECT customer_id, COUNT(*) AS order_count\nFROM orders\nGROUP BY customer_id;'
  },
  {
    id: 4,
    title: 'Departments with average salary above 80000',
    difficulty: 'Medium',
    topic: 'HAVING',
    companies: ['Google', 'Microsoft', 'Oracle'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Find department IDs where the average salary is greater than 80000.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['department_id', 'avg_salary'], rows: [['10', '98500']] },
    explanation: 'HAVING filters groups after AVG is calculated.',
    hint: 'WHERE filters rows; HAVING filters grouped results.',
    solution: 'SELECT department_id, AVG(salary) AS avg_salary\nFROM employees\nGROUP BY department_id\nHAVING AVG(salary) > 80000;'
  },
  {
    id: 5,
    title: 'Show employees with department names',
    difficulty: 'Easy',
    topic: 'INNER JOIN',
    companies: ['Microsoft', 'Infosys', 'Accenture'],
    estimatedTime: 15,
    solved: true,
    prompt: 'Return each employee name with their department name.',
    sampleTables: [employeesTable, departmentsTable],
    expectedOutput: { columns: ['name', 'department_name'], rows: [['Asha', 'Engineering'], ['Ben', 'Sales'], ['Chen', 'Engineering'], ['Diya', 'Support']] },
    explanation: 'An inner join keeps employees whose department exists in departments.',
    hint: 'Join on department_id.',
    solution: 'SELECT e.name, d.department_name\nFROM employees e\nINNER JOIN departments d ON d.department_id = e.department_id;'
  },
  {
    id: 6,
    title: 'Customers with or without orders',
    difficulty: 'Medium',
    topic: 'LEFT JOIN',
    companies: ['Amazon', 'Meta', 'Oracle'],
    estimatedTime: 20,
    solved: false,
    prompt: 'List all customers and their order IDs, keeping customers who have not ordered.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name', 'order_id'], rows: [['Northwind Labs', '101'], ['Northwind Labs', '103'], ['Bluebird Retail', '102'], ['Core Bank', '104'], ['Delta Health', 'NULL']] },
    explanation: 'A left join preserves all customers and fills missing order data with NULL.',
    hint: 'Put customers on the left side of the join.',
    solution: 'SELECT c.customer_name, o.order_id\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id;'
  },
  {
    id: 7,
    title: 'Departments without employees',
    difficulty: 'Medium',
    topic: 'LEFT JOIN',
    companies: ['Google', 'Oracle', 'TCS'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Find department names that currently have no employees.',
    sampleTables: [departmentsTable, employeesTable],
    expectedOutput: { columns: ['department_name'], rows: [['Finance']] },
    explanation: 'A left join from departments to employees reveals unmatched departments through NULL employee IDs.',
    hint: 'Filter for NULL on the employee side.',
    solution: 'SELECT d.department_name\nFROM departments d\nLEFT JOIN employees e ON e.department_id = d.department_id\nWHERE e.employee_id IS NULL;'
  },
  {
    id: 8,
    title: 'Orders with payment timestamps',
    difficulty: 'Easy',
    topic: 'JOIN',
    companies: ['Amazon', 'Microsoft', 'Infosys'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Return paid order IDs with their payment timestamp.',
    sampleTables: [ordersTable, paymentsTable],
    expectedOutput: { columns: ['order_id', 'paid_at'], rows: [['101', '2026-01-04'], ['102', '2026-01-06'], ['104', '2026-01-12']] },
    explanation: 'Joining payments to orders by order_id gives the payment metadata for completed payments.',
    hint: 'Only orders that have a matching payment should appear.',
    solution: 'SELECT o.order_id, p.paid_at\nFROM orders o\nJOIN payments p ON p.order_id = o.order_id;'
  },
  {
    id: 9,
    title: 'Highest salary by department',
    difficulty: 'Easy',
    topic: 'Aggregate Functions',
    companies: ['Meta', 'TCS', 'Accenture'],
    estimatedTime: 15,
    solved: true,
    prompt: 'Return each department ID and the maximum salary in that department.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['department_id', 'max_salary'], rows: [['10', '105000'], ['20', '76000'], ['30', '68000']] },
    explanation: 'MAX returns the largest salary in each department group.',
    hint: 'Group by department_id.',
    solution: 'SELECT department_id, MAX(salary) AS max_salary\nFROM employees\nGROUP BY department_id;'
  },
  {
    id: 10,
    title: 'Customers above average order amount',
    difficulty: 'Medium',
    topic: 'Subqueries',
    companies: ['Google', 'Amazon', 'Oracle'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Find orders whose amount is greater than the overall average order amount.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['order_id', 'amount'], rows: [['101', '240'], ['104', '420']] },
    explanation: 'The scalar subquery calculates the global average, then the outer query compares each order to it.',
    hint: 'Use AVG(amount) inside a nested SELECT.',
    solution: 'SELECT order_id, amount\nFROM orders\nWHERE amount > (SELECT AVG(amount) FROM orders);'
  },
  {
    id: 11,
    title: 'Rank employees by salary',
    difficulty: 'Medium',
    topic: 'Window Functions',
    companies: ['Meta', 'Google', 'Microsoft'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Rank employees from highest salary to lowest salary.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['name', 'salary', 'salary_rank'], rows: [['Chen', '105000', '1'], ['Asha', '92000', '2'], ['Ben', '76000', '3'], ['Diya', '68000', '4']] },
    explanation: 'RANK assigns ordered positions without collapsing rows.',
    hint: 'Use RANK() OVER with an ORDER BY salary DESC.',
    solution: 'SELECT name, salary, RANK() OVER (ORDER BY salary DESC) AS salary_rank\nFROM employees;'
  },
  {
    id: 12,
    title: 'First order per customer',
    difficulty: 'Medium',
    topic: 'Window Functions',
    companies: ['Amazon', 'Meta', 'Google'],
    estimatedTime: 30,
    solved: false,
    prompt: 'Return the earliest order for each customer.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['customer_id', 'order_id', 'order_date'], rows: [['1', '101', '2026-01-04'], ['2', '102', '2026-01-05'], ['3', '104', '2026-01-12']] },
    explanation: 'ROW_NUMBER can identify the first row inside each customer partition.',
    hint: 'Filter row_number = 1 in an outer query or CTE.',
    solution: 'WITH ranked_orders AS (\n  SELECT customer_id, order_id, order_date,\n    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY order_date) AS rn\n  FROM orders\n)\nSELECT customer_id, order_id, order_date\nFROM ranked_orders\nWHERE rn = 1;'
  },
  {
    id: 13,
    title: 'Revenue by city',
    difficulty: 'Medium',
    topic: 'GROUP BY',
    companies: ['Amazon', 'Accenture', 'Infosys'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Calculate total paid order amount by customer city.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['city', 'revenue'], rows: [['Austin', '180'], ['New York', '420'], ['Seattle', '240']] },
    explanation: 'Joining customers to orders supplies city, then SUM aggregates paid revenue.',
    hint: "Filter status = 'paid' before grouping.",
    solution: "SELECT c.city, SUM(o.amount) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nWHERE o.status = 'paid'\nGROUP BY c.city;"
  },
  {
    id: 14,
    title: 'Find duplicated inventory SKUs',
    difficulty: 'Easy',
    topic: 'HAVING',
    companies: ['Oracle', 'TCS', 'Infosys'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Find SKUs that appear in more than one warehouse.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'warehouse_count'], rows: [['A-100', '2']] },
    explanation: 'Groups with a count greater than one represent SKUs stocked across multiple warehouses.',
    hint: 'Use COUNT(DISTINCT warehouse_id).',
    solution: 'SELECT sku, COUNT(DISTINCT warehouse_id) AS warehouse_count\nFROM inventory\nGROUP BY sku\nHAVING COUNT(DISTINCT warehouse_id) > 1;'
  },
  {
    id: 15,
    title: 'Employees earning more than department average',
    difficulty: 'Hard',
    topic: 'Subqueries',
    companies: ['Google', 'Meta', 'Microsoft'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Return employees whose salary is greater than the average salary of their own department.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['name', 'salary'], rows: [['Chen', '105000']] },
    explanation: 'A correlated subquery compares each employee to their department-specific average.',
    hint: 'Correlate the inner department_id to the outer row.',
    solution: 'SELECT e.name, e.salary\nFROM employees e\nWHERE e.salary > (\n  SELECT AVG(e2.salary)\n  FROM employees e2\n  WHERE e2.department_id = e.department_id\n);'
  },
  {
    id: 16,
    title: 'Monthly paid revenue using a CTE',
    difficulty: 'Medium',
    topic: 'CTE',
    companies: ['Amazon', 'Microsoft', 'Oracle'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Use a CTE to calculate paid revenue by order month.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['order_month', 'revenue'], rows: [['2026-01', '840']] },
    explanation: 'The CTE isolates paid orders, and the outer query groups by formatted month.',
    hint: 'Create a paid_orders CTE first.',
    solution: "WITH paid_orders AS (\n  SELECT order_date, amount\n  FROM orders\n  WHERE status = 'paid'\n)\nSELECT DATE_FORMAT(order_date, '%Y-%m') AS order_month, SUM(amount) AS revenue\nFROM paid_orders\nGROUP BY DATE_FORMAT(order_date, '%Y-%m');"
  },
  {
    id: 17,
    title: 'Right join departments to employees',
    difficulty: 'Medium',
    topic: 'RIGHT JOIN',
    companies: ['Oracle', 'Infosys', 'TCS'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return every department and any employee assigned to it using a RIGHT JOIN.',
    sampleTables: [employeesTable, departmentsTable],
    expectedOutput: { columns: ['department_name', 'name'], rows: [['Engineering', 'Asha'], ['Engineering', 'Chen'], ['Sales', 'Ben'], ['Support', 'Diya'], ['Finance', 'NULL']] },
    explanation: 'With departments on the right side, RIGHT JOIN preserves departments without employees.',
    hint: 'Join employees to departments and preserve the department table.',
    solution: 'SELECT d.department_name, e.name\nFROM employees e\nRIGHT JOIN departments d ON d.department_id = e.department_id;'
  },
  {
    id: 18,
    title: 'Full outer join customers and orders',
    difficulty: 'Hard',
    topic: 'FULL JOIN',
    companies: ['Microsoft', 'Google', 'Oracle'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Show all customers and all orders, including unmatched rows from either side.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_id', 'customer_name', 'order_id'], rows: [['1', 'Northwind Labs', '101'], ['1', 'Northwind Labs', '103'], ['2', 'Bluebird Retail', '102'], ['3', 'Core Bank', '104'], ['4', 'Delta Health', 'NULL']] },
    explanation: 'A full outer join preserves unmatched rows from both input tables.',
    hint: 'Use FULL OUTER JOIN where supported; otherwise combine left and right joins.',
    solution: 'SELECT COALESCE(c.customer_id, o.customer_id) AS customer_id, c.customer_name, o.order_id\nFROM customers c\nFULL OUTER JOIN orders o ON o.customer_id = c.customer_id;'
  },
  {
    id: 19,
    title: 'Create an index for customer order lookup',
    difficulty: 'Medium',
    topic: 'Indexing',
    companies: ['Amazon', 'Oracle', 'Microsoft'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Suggest an index for frequent lookups by customer_id and order_date on orders.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['index_name', 'columns'], rows: [['idx_orders_customer_date', 'customer_id, order_date']] },
    explanation: 'A composite index supports filtering by customer and ordering or range filtering by date.',
    hint: 'Put the equality predicate column before the range/date column.',
    solution: 'CREATE INDEX idx_orders_customer_date\nON orders (customer_id, order_date);'
  },
  {
    id: 20,
    title: 'Transfer inventory between warehouses',
    difficulty: 'Hard',
    topic: 'Transactions',
    companies: ['Amazon', 'Oracle', 'Accenture'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Write a transaction that moves 5 units of SKU A-100 from warehouse 1 to warehouse 2.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'warehouse_id', 'quantity'], rows: [['A-100', '1', '13'], ['A-100', '2', '12']] },
    explanation: 'Both updates must commit together so inventory is not lost if one update fails.',
    hint: 'Use BEGIN, two UPDATE statements, then COMMIT.',
    solution: "BEGIN;\nUPDATE inventory\nSET quantity = quantity - 5\nWHERE sku = 'A-100' AND warehouse_id = 1 AND quantity >= 5;\n\nUPDATE inventory\nSET quantity = quantity + 5\nWHERE sku = 'A-100' AND warehouse_id = 2;\nCOMMIT;"
  },
  {
    id: 21,
    title: 'Select unique customer cities',
    difficulty: 'Easy',
    topic: 'SELECT',
    companies: ['TCS', 'Infosys', 'Accenture'],
    estimatedTime: 10,
    solved: true,
    prompt: 'Return the distinct cities represented in the customers table.',
    sampleTables: [customersTable],
    expectedOutput: { columns: ['city'], rows: [['Austin'], ['Boston'], ['New York'], ['Seattle']] },
    explanation: 'DISTINCT removes duplicate city values from the projection.',
    hint: 'Use DISTINCT with one selected column.',
    solution: 'SELECT DISTINCT city\nFROM customers\nORDER BY city;'
  },
  {
    id: 22,
    title: 'Filter zero stock SKUs',
    difficulty: 'Easy',
    topic: 'WHERE',
    companies: ['Amazon', 'Oracle', 'TCS'],
    estimatedTime: 10,
    solved: false,
    prompt: 'Find SKUs and warehouses where quantity is zero.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'warehouse_id'], rows: [['B-200', '1']] },
    explanation: 'The WHERE predicate isolates rows with no available stock.',
    hint: 'Compare quantity to 0.',
    solution: 'SELECT sku, warehouse_id\nFROM inventory\nWHERE quantity = 0;'
  },
  {
    id: 23,
    title: 'Average paid order amount',
    difficulty: 'Easy',
    topic: 'Aggregate Functions',
    companies: ['Meta', 'Google', 'Accenture'],
    estimatedTime: 12,
    solved: false,
    prompt: 'Calculate the average amount of paid orders.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['avg_paid_amount'], rows: [['280']] },
    explanation: 'AVG only considers rows that pass the paid status filter.',
    hint: "Filter status = 'paid'.",
    solution: "SELECT AVG(amount) AS avg_paid_amount\nFROM orders\nWHERE status = 'paid';"
  },
  {
    id: 24,
    title: 'Customers with paid revenue above 300',
    difficulty: 'Medium',
    topic: 'HAVING',
    companies: ['Amazon', 'Meta', 'Microsoft'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Return customers whose paid order revenue is greater than 300.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name', 'revenue'], rows: [['Core Bank', '420']] },
    explanation: 'SUM is computed after joining and filtering paid orders, then HAVING filters the grouped customers.',
    hint: 'Group by customer name and use HAVING SUM(amount) > 300.',
    solution: "SELECT c.customer_name, SUM(o.amount) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nWHERE o.status = 'paid'\nGROUP BY c.customer_name\nHAVING SUM(o.amount) > 300;"
  },
  {
    id: 25,
    title: 'Customer order counts including zero',
    difficulty: 'Medium',
    topic: 'LEFT JOIN',
    companies: ['Microsoft', 'Oracle', 'Infosys'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return every customer with the number of orders they have placed.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name', 'order_count'], rows: [['Northwind Labs', '2'], ['Bluebird Retail', '1'], ['Core Bank', '1'], ['Delta Health', '0']] },
    explanation: 'COUNT(o.order_id) counts only matched orders while preserving customers with no rows.',
    hint: 'Use LEFT JOIN and COUNT on a nullable joined column.',
    solution: 'SELECT c.customer_name, COUNT(o.order_id) AS order_count\nFROM customers c\nLEFT JOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_name;'
  },
  {
    id: 26,
    title: 'Orders missing payments',
    difficulty: 'Medium',
    topic: 'LEFT JOIN',
    companies: ['Amazon', 'Google', 'Oracle'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Find orders that do not have a payment record.',
    sampleTables: [ordersTable, paymentsTable],
    expectedOutput: { columns: ['order_id'], rows: [['103']] },
    explanation: 'A left join plus NULL filter finds rows in orders with no matching payment.',
    hint: 'Check p.payment_id IS NULL.',
    solution: 'SELECT o.order_id\nFROM orders o\nLEFT JOIN payments p ON p.order_id = o.order_id\nWHERE p.payment_id IS NULL;'
  },
  {
    id: 27,
    title: 'Second highest salary',
    difficulty: 'Medium',
    topic: 'Subqueries',
    companies: ['Google', 'Meta', 'Microsoft'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Return the second highest distinct salary from employees.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['second_highest_salary'], rows: [['92000']] },
    explanation: 'The inner query finds the maximum salary; the outer query finds the maximum below it.',
    hint: 'Use MAX where salary is less than another MAX.',
    solution: 'SELECT MAX(salary) AS second_highest_salary\nFROM employees\nWHERE salary < (SELECT MAX(salary) FROM employees);'
  },
  {
    id: 28,
    title: 'Running revenue by order date',
    difficulty: 'Hard',
    topic: 'Window Functions',
    companies: ['Amazon', 'Google', 'Meta'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Calculate cumulative paid revenue ordered by order_date.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['order_date', 'amount', 'running_revenue'], rows: [['2026-01-04', '240', '240'], ['2026-01-05', '180', '420'], ['2026-01-12', '420', '840']] },
    explanation: 'A running SUM window accumulates paid amounts in date order.',
    hint: 'Use SUM(amount) OVER (ORDER BY order_date).',
    solution: "SELECT order_date, amount,\n  SUM(amount) OVER (ORDER BY order_date) AS running_revenue\nFROM orders\nWHERE status = 'paid'\nORDER BY order_date;"
  },
  {
    id: 29,
    title: 'Department salary share',
    difficulty: 'Hard',
    topic: 'Window Functions',
    companies: ['Microsoft', 'Meta', 'Oracle'],
    estimatedTime: 35,
    solved: false,
    prompt: 'For each employee, show their salary as a share of total salary in their department.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['name', 'department_id', 'salary_share'], rows: [['Asha', '10', '0.467'], ['Chen', '10', '0.533'], ['Ben', '20', '1.000'], ['Diya', '30', '1.000']] },
    explanation: 'The partitioned SUM gives the denominator for each employee department.',
    hint: 'Divide salary by SUM(salary) OVER (PARTITION BY department_id).',
    solution: 'SELECT name, department_id,\n  ROUND(salary / SUM(salary) OVER (PARTITION BY department_id), 3) AS salary_share\nFROM employees;'
  },
  {
    id: 30,
    title: 'Inventory totals with a CTE',
    difficulty: 'Easy',
    topic: 'CTE',
    companies: ['TCS', 'Infosys', 'Oracle'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Use a CTE to total quantity by SKU.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'total_quantity'], rows: [['A-100', '25'], ['B-200', '0'], ['C-300', '42']] },
    explanation: 'The CTE makes the grouped totals available to the final select.',
    hint: 'Group inventory by sku inside the CTE.',
    solution: 'WITH sku_totals AS (\n  SELECT sku, SUM(quantity) AS total_quantity\n  FROM inventory\n  GROUP BY sku\n)\nSELECT sku, total_quantity\nFROM sku_totals;'
  },
  {
    id: 31,
    title: 'Find customers who ordered and paid',
    difficulty: 'Easy',
    topic: 'INNER JOIN',
    companies: ['Amazon', 'Accenture', 'Infosys'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Return distinct customers who have at least one payment.',
    sampleTables: [customersTable, ordersTable, paymentsTable],
    expectedOutput: { columns: ['customer_name'], rows: [['Northwind Labs'], ['Bluebird Retail'], ['Core Bank']] },
    explanation: 'Joining through orders to payments keeps customers with completed payment records.',
    hint: 'Use DISTINCT to avoid duplicates.',
    solution: 'SELECT DISTINCT c.customer_name\nFROM customers c\nINNER JOIN orders o ON o.customer_id = c.customer_id\nINNER JOIN payments p ON p.order_id = o.order_id;'
  },
  {
    id: 32,
    title: 'Join orders to customer geography',
    difficulty: 'Easy',
    topic: 'JOIN',
    companies: ['Microsoft', 'TCS', 'Accenture'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Return order ID, customer name, and customer city for every order.',
    sampleTables: [ordersTable, customersTable],
    expectedOutput: { columns: ['order_id', 'customer_name', 'city'], rows: [['101', 'Northwind Labs', 'Seattle'], ['102', 'Bluebird Retail', 'Austin'], ['103', 'Northwind Labs', 'Seattle'], ['104', 'Core Bank', 'New York']] },
    explanation: 'The join enriches orders with customer attributes.',
    hint: 'Join on customer_id.',
    solution: 'SELECT o.order_id, c.customer_name, c.city\nFROM orders o\nJOIN customers c ON c.customer_id = o.customer_id;'
  },
  {
    id: 33,
    title: 'Departments ordered by headcount',
    difficulty: 'Medium',
    topic: 'GROUP BY',
    companies: ['Google', 'Oracle', 'Infosys'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return department names with employee counts, ordered by count descending.',
    sampleTables: [departmentsTable, employeesTable],
    expectedOutput: { columns: ['department_name', 'headcount'], rows: [['Engineering', '2'], ['Sales', '1'], ['Support', '1'], ['Finance', '0']] },
    explanation: 'A left join keeps empty departments while GROUP BY enables counting.',
    hint: 'COUNT employee_id, not COUNT(*).',
    solution: 'SELECT d.department_name, COUNT(e.employee_id) AS headcount\nFROM departments d\nLEFT JOIN employees e ON e.department_id = d.department_id\nGROUP BY d.department_name\nORDER BY headcount DESC;'
  },
  {
    id: 34,
    title: 'Filter recent signups by city',
    difficulty: 'Easy',
    topic: 'WHERE',
    companies: ['Meta', 'Accenture', 'TCS'],
    estimatedTime: 10,
    solved: false,
    prompt: 'Find customers in Boston or New York who signed up in 2026.',
    sampleTables: [customersTable],
    expectedOutput: { columns: ['customer_name', 'city'], rows: [['Core Bank', 'New York'], ['Delta Health', 'Boston']] },
    explanation: 'The query combines an IN predicate with a date range.',
    hint: 'Use city IN (...) and signup_date >= 2026-01-01.',
    solution: "SELECT customer_name, city\nFROM customers\nWHERE city IN ('Boston', 'New York') AND signup_date >= '2026-01-01';"
  },
  {
    id: 35,
    title: 'Orders above customer average',
    difficulty: 'Hard',
    topic: 'Subqueries',
    companies: ['Amazon', 'Google', 'Meta'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Return orders whose amount is greater than the average order amount for that same customer.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['order_id', 'customer_id', 'amount'], rows: [['101', '1', '240']] },
    explanation: 'The correlated subquery calculates each customer average and compares the current order to it.',
    hint: 'Correlate by customer_id.',
    solution: 'SELECT o.order_id, o.customer_id, o.amount\nFROM orders o\nWHERE o.amount > (\n  SELECT AVG(o2.amount)\n  FROM orders o2\n  WHERE o2.customer_id = o.customer_id\n);'
  },
  {
    id: 36,
    title: 'Paid order percentage by customer',
    difficulty: 'Hard',
    topic: 'Aggregate Functions',
    companies: ['Microsoft', 'Meta', 'Oracle'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Calculate the share of each customer orders that are paid.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name', 'paid_rate'], rows: [['Northwind Labs', '0.50'], ['Bluebird Retail', '1.00'], ['Core Bank', '1.00']] },
    explanation: 'Conditional aggregation counts paid orders and divides by total orders.',
    hint: "Use SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END).",
    solution: "SELECT c.customer_name,\n  ROUND(SUM(CASE WHEN o.status = 'paid' THEN 1 ELSE 0 END) / COUNT(*), 2) AS paid_rate\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nGROUP BY c.customer_name;"
  },
  {
    id: 37,
    title: 'Full join payment reconciliation',
    difficulty: 'Hard',
    topic: 'FULL JOIN',
    companies: ['Oracle', 'Microsoft', 'Accenture'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Reconcile orders and payments so unmatched orders or payments are visible.',
    sampleTables: [ordersTable, paymentsTable],
    expectedOutput: { columns: ['order_id', 'payment_id'], rows: [['101', '9001'], ['102', '9002'], ['103', 'NULL'], ['104', '9003']] },
    explanation: 'A full outer join is useful for reconciliation because neither side is dropped.',
    hint: 'Join by order_id and preserve unmatched rows.',
    solution: 'SELECT COALESCE(o.order_id, p.order_id) AS order_id, p.payment_id\nFROM orders o\nFULL OUTER JOIN payments p ON p.order_id = o.order_id;'
  },
  {
    id: 38,
    title: 'Right join payments back to orders',
    difficulty: 'Medium',
    topic: 'RIGHT JOIN',
    companies: ['Oracle', 'Infosys', 'Accenture'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return every order and any payment using a RIGHT JOIN.',
    sampleTables: [paymentsTable, ordersTable],
    expectedOutput: { columns: ['order_id', 'payment_id'], rows: [['101', '9001'], ['102', '9002'], ['103', 'NULL'], ['104', '9003']] },
    explanation: 'Orders on the right side are preserved, including the refunded order without payment.',
    hint: 'Use payments RIGHT JOIN orders.',
    solution: 'SELECT o.order_id, p.payment_id\nFROM payments p\nRIGHT JOIN orders o ON o.order_id = p.order_id;'
  },
  {
    id: 39,
    title: 'Index for status revenue report',
    difficulty: 'Medium',
    topic: 'Indexing',
    companies: ['Amazon', 'Google', 'Oracle'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Suggest an index for reports that filter orders by status and group by order_date.',
    sampleTables: [ordersTable],
    expectedOutput: { columns: ['index_name', 'columns'], rows: [['idx_orders_status_date', 'status, order_date']] },
    explanation: 'Filtering by status first and then scanning dates benefits from a composite index.',
    hint: 'Place status before order_date.',
    solution: 'CREATE INDEX idx_orders_status_date\nON orders (status, order_date);'
  },
  {
    id: 40,
    title: 'Rollback failed payment update',
    difficulty: 'Hard',
    topic: 'Transactions',
    companies: ['Oracle', 'Amazon', 'Microsoft'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Write a transaction that marks an order as paid only after inserting its payment.',
    sampleTables: [ordersTable, paymentsTable],
    expectedOutput: { columns: ['order_id', 'status'], rows: [['103', 'paid']] },
    explanation: 'The payment insert and order status update must succeed or fail as a unit.',
    hint: 'Use BEGIN, INSERT, UPDATE, and COMMIT.',
    solution: "BEGIN;\nINSERT INTO payments (payment_id, order_id, paid_at, amount)\nVALUES (9004, 103, '2026-01-13', 90);\n\nUPDATE orders\nSET status = 'paid'\nWHERE order_id = 103;\nCOMMIT;"
  },
  {
    id: 41,
    title: 'Select columns with aliases',
    difficulty: 'Easy',
    topic: 'SELECT',
    companies: ['Infosys', 'TCS', 'Accenture'],
    estimatedTime: 10,
    solved: false,
    prompt: 'Return employee name as employee_name and salary as annual_salary.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['employee_name', 'annual_salary'], rows: [['Asha', '92000'], ['Ben', '76000'], ['Chen', '105000'], ['Diya', '68000']] },
    explanation: 'Column aliases make result sets clearer for downstream consumers.',
    hint: 'Use AS for each alias.',
    solution: 'SELECT name AS employee_name, salary AS annual_salary\nFROM employees;'
  },
  {
    id: 42,
    title: 'Find engineering employees',
    difficulty: 'Easy',
    topic: 'INNER JOIN',
    companies: ['Microsoft', 'Google', 'Infosys'],
    estimatedTime: 15,
    solved: false,
    prompt: 'Return employees who work in Engineering.',
    sampleTables: [employeesTable, departmentsTable],
    expectedOutput: { columns: ['name'], rows: [['Asha'], ['Chen']] },
    explanation: 'The department name lives in departments, so a join is required before filtering.',
    hint: "Join departments and filter department_name = 'Engineering'.",
    solution: "SELECT e.name\nFROM employees e\nJOIN departments d ON d.department_id = e.department_id\nWHERE d.department_name = 'Engineering';"
  },
  {
    id: 43,
    title: 'Top customer by revenue',
    difficulty: 'Medium',
    topic: 'Aggregate Functions',
    companies: ['Amazon', 'Meta', 'Microsoft'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return the customer with the highest paid revenue.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name', 'revenue'], rows: [['Core Bank', '420']] },
    explanation: 'Aggregate paid revenue per customer, sort descending, and take the first row.',
    hint: 'Use ORDER BY revenue DESC with LIMIT 1.',
    solution: "SELECT c.customer_name, SUM(o.amount) AS revenue\nFROM customers c\nJOIN orders o ON o.customer_id = c.customer_id\nWHERE o.status = 'paid'\nGROUP BY c.customer_name\nORDER BY revenue DESC\nLIMIT 1;"
  },
  {
    id: 44,
    title: 'Employees hired per year',
    difficulty: 'Medium',
    topic: 'GROUP BY',
    companies: ['Oracle', 'TCS', 'Accenture'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Count employees hired in each year.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['hire_year', 'employee_count'], rows: [['2020', '1'], ['2021', '1'], ['2022', '1'], ['2023', '1']] },
    explanation: 'Extracting the year turns hire dates into groupable reporting periods.',
    hint: 'Use EXTRACT(YEAR FROM hire_date) or database equivalent.',
    solution: 'SELECT EXTRACT(YEAR FROM hire_date) AS hire_year, COUNT(*) AS employee_count\nFROM employees\nGROUP BY EXTRACT(YEAR FROM hire_date)\nORDER BY hire_year;'
  },
  {
    id: 45,
    title: 'Customers without paid orders',
    difficulty: 'Medium',
    topic: 'Subqueries',
    companies: ['Google', 'Oracle', 'Infosys'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Find customers who do not have any paid orders.',
    sampleTables: [customersTable, ordersTable],
    expectedOutput: { columns: ['customer_name'], rows: [['Delta Health']] },
    explanation: 'NOT EXISTS checks for absence of a qualifying paid order per customer.',
    hint: 'Correlate the subquery on customer_id.',
    solution: "SELECT c.customer_name\nFROM customers c\nWHERE NOT EXISTS (\n  SELECT 1\n  FROM orders o\n  WHERE o.customer_id = c.customer_id AND o.status = 'paid'\n);"
  },
  {
    id: 46,
    title: 'Department salary rank',
    difficulty: 'Hard',
    topic: 'Window Functions',
    companies: ['Google', 'Meta', 'Oracle'],
    estimatedTime: 35,
    solved: false,
    prompt: 'Rank employees by salary within each department.',
    sampleTables: [employeesTable],
    expectedOutput: { columns: ['department_id', 'name', 'department_rank'], rows: [['10', 'Chen', '1'], ['10', 'Asha', '2'], ['20', 'Ben', '1'], ['30', 'Diya', '1']] },
    explanation: 'Partitioned ranking restarts the rank inside each department.',
    hint: 'PARTITION BY department_id and ORDER BY salary DESC.',
    solution: 'SELECT department_id, name,\n  RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS department_rank\nFROM employees;'
  },
  {
    id: 47,
    title: 'Inventory reorder candidates',
    difficulty: 'Easy',
    topic: 'WHERE',
    companies: ['Amazon', 'TCS', 'Infosys'],
    estimatedTime: 10,
    solved: false,
    prompt: 'Find inventory rows where quantity is less than 10.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'warehouse_id', 'quantity'], rows: [['A-100', '2', '7'], ['B-200', '1', '0']] },
    explanation: 'Low-stock rows are identified with a simple numeric comparison.',
    hint: 'Use quantity < 10.',
    solution: 'SELECT sku, warehouse_id, quantity\nFROM inventory\nWHERE quantity < 10;'
  },
  {
    id: 48,
    title: 'Average salary by department name',
    difficulty: 'Medium',
    topic: 'JOIN',
    companies: ['Microsoft', 'Accenture', 'Oracle'],
    estimatedTime: 20,
    solved: false,
    prompt: 'Return department names and average salaries for departments with employees.',
    sampleTables: [employeesTable, departmentsTable],
    expectedOutput: { columns: ['department_name', 'avg_salary'], rows: [['Engineering', '98500'], ['Sales', '76000'], ['Support', '68000']] },
    explanation: 'Joining department names before grouping creates a readable aggregate report.',
    hint: 'Group by department_name.',
    solution: 'SELECT d.department_name, AVG(e.salary) AS avg_salary\nFROM employees e\nJOIN departments d ON d.department_id = e.department_id\nGROUP BY d.department_name;'
  },
  {
    id: 49,
    title: 'CTE for high value paid orders',
    difficulty: 'Medium',
    topic: 'CTE',
    companies: ['Amazon', 'Google', 'Meta'],
    estimatedTime: 25,
    solved: false,
    prompt: 'Use a CTE to return paid orders with amount of at least 200 and their customer names.',
    sampleTables: [ordersTable, customersTable],
    expectedOutput: { columns: ['order_id', 'customer_name', 'amount'], rows: [['101', 'Northwind Labs', '240'], ['104', 'Core Bank', '420']] },
    explanation: 'The CTE narrows orders first; the final query joins to customer details.',
    hint: 'Filter in the CTE, join outside it.',
    solution: "WITH high_value_orders AS (\n  SELECT order_id, customer_id, amount\n  FROM orders\n  WHERE status = 'paid' AND amount >= 200\n)\nSELECT h.order_id, c.customer_name, h.amount\nFROM high_value_orders h\nJOIN customers c ON c.customer_id = h.customer_id;"
  },
  {
    id: 50,
    title: 'Prevent negative inventory with a transaction',
    difficulty: 'Hard',
    topic: 'Transactions',
    companies: ['Amazon', 'Oracle', 'Microsoft'],
    estimatedTime: 40,
    solved: false,
    prompt: 'Write a transaction-safe update that reserves 3 units only when inventory is available.',
    sampleTables: [inventoryTable],
    expectedOutput: { columns: ['sku', 'warehouse_id', 'quantity'], rows: [['A-100', '1', '15']] },
    explanation: 'The availability condition in the UPDATE prevents quantity from dropping below zero.',
    hint: 'Include quantity >= 3 in the UPDATE predicate.',
    solution: "BEGIN;\nUPDATE inventory\nSET quantity = quantity - 3\nWHERE sku = 'A-100' AND warehouse_id = 1 AND quantity >= 3;\nCOMMIT;"
  }
];
