# フロントエンドコーディング規約

このドキュメントは、React + TypeScript を使用したフロントエンド開発におけるコーディング規約を定義します。
バックエンド規約の精神（型安全性、保守性、単一責任の原則）を踏まえつつ、React 特有のパターンとベストプラクティスを含みます。

---

## 目次

1. [型安全性に関する規約](#型安全性に関する規約)
2. [コンポーネント設計規約](#コンポーネント設計規約)
3. [フック（Hooks）使用規約](#フックhooks使用規約)
4. [状態管理規約](#状態管理規約)
5. [イベントハンドリング規約](#イベントハンドリング規約)
6. [パフォーマンス最適化規約](#パフォーマンス最適化規約)
7. [スタイリング規約](#スタイリング規約)
8. [フォーム処理規約](#フォーム処理規約)
9. [API通信規約](#api通信規約)
10. [エラーハンドリング規約](#エラーハンドリング規約)
11. [テスト規約](#テスト規約)
12. [アクセシビリティ規約](#アクセシビリティ規約)
13. [ファイル構成規約](#ファイル構成規約)
14. [命名規約](#命名規約)
15. [コメント・ドキュメント規約](#コメントドキュメント規約)

---

## 型安全性に関する規約

### ❌ 1. `any`型の使用禁止

**禁止事項**: `any`型の使用は厳禁です。TypeScript の型チェックの恩恵を受けられません。

**禁止例**:

```typescript
// ❌ 禁止: any型の使用
function UserCard(props: any) {
  return <div>{props.name}</div>;
}

const [data, setData] = useState<any>(null);
const handleClick = (event: any) => { /* ... */ };
```

**推奨実装**:

```typescript
// ✅ 推奨: 適切な型を定義
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
}

function UserCard(props: UserCardProps) {
  return <div>{props.name}</div>;
}

// ✅ 推奨: ジェネリクスを使用
interface ApiResponse<T> {
  data: T;
  status: number;
}

const [data, setData] = useState<ApiResponse<User> | null>(null);

// ✅ 推奨: React の型を使用
const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.preventDefault();
  // ...
};
```

### ❌ 2. 型アサーション（`as`）の多用禁止

**禁止事項**: 型アサーション（`as`）を多用することは禁止です。型安全性が失われます。

**禁止例**:

```typescript
// ❌ 禁止: as anyの使用
const user = response.data as any;
const element = document.getElementById('root') as any;
const value = (event.target as any).value;
```

**推奨実装**:

```typescript
// ✅ 推奨: 型ガードを使用
function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value &&
    typeof (value as { id: unknown }).id === "string" &&
    typeof (value as { email: unknown }).email === "string"
  );
}

if (isUser(response.data)) {
  const user = response.data; // 型安全
}

// ✅ 推奨: Zodなどのバリデーションライブラリを使用
const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
});

const validated = UserSchema.parse(response.data);
const user = validated; // 型安全

// ✅ 推奨: null チェックを明示的に行う
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
// ここでは rootElement は HTMLElement 型として扱える

// ✅ 推奨: React の型を使用
const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  const value = event.target.value; // 型安全
};
```

### ❌ 3. Non-null assertion (`!`)の使用禁止

**禁止事項**: Non-null assertion (`!`)の使用は禁止です。実行時には保証されません。

**禁止例**:

```typescript
// ❌ 禁止: !演算子の使用
const user = users.find(u => u.id === id)!;
const element = document.getElementById('root')!;
const value = ref.current!.value;
```

**推奨実装**:

```typescript
// ✅ 推奨: 明示的なチェック
const user = users.find(u => u.id === id);
if (!user) {
  return <div>User not found</div>;
}
// ここでは user は User 型として扱える

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

// ✅ 推奨: オプショナルチェーンとデフォルト値
const value = ref.current?.value ?? '';
```

### ❌ 4. Props の型定義を省略しない

**禁止事項**: Props の型定義を省略することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: Props の型定義なし
function UserCard(props) {
  return <div>{props.name}</div>;
}

// ❌ 禁止: インライン型定義（複雑な場合）
function UserCard(props: { name: string; email: string; avatar?: string; onClick: () => void }) {
  // ...
}
```

**推奨実装**:

```typescript
// ✅ 推奨: interface で Props を定義
interface UserCardProps {
  name: string;
  email: string;
  avatar?: string;
  onClick: () => void;
}

function UserCard(props: UserCardProps) {
  return <div>{props.name}</div>;
}

// ✅ 推奨: React.FC を使用（オプション）
const UserCard: React.FC<UserCardProps> = ({ name, email, avatar, onClick }) => {
  return <div>{name}</div>;
};
```

### ❌ 5. イベントハンドラーの型を省略しない

**禁止事項**: イベントハンドラーの型を省略することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: イベントハンドラーの型なし
const handleClick = (e) => { /* ... */ };
const handleChange = (e) => { /* ... */ };
const handleSubmit = (e) => { /* ... */ };
```

**推奨実装**:

```typescript
// ✅ 推奨: React の型を使用
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // ...
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

---

## コンポーネント設計規約

### ❌ 1. 巨大なコンポーネント（単一責任の原則違反）

**禁止事項**: 1つのコンポーネントが200行を超える場合は、複数のコンポーネントに分割してください。

**禁止例**:

```typescript
// ❌ 禁止: 巨大なコンポーネント（300行以上）
function UserDashboard() {
  // ユーザー情報の取得と表示（50行）
  // タスク一覧の取得と表示（80行）
  // プロジェクト一覧の取得と表示（80行）
  // フォーム処理（50行）
  // その他の処理（40行）
  return (
    <div>
      {/* 大量のJSX */}
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: コンポーネントを分割
function UserDashboard() {
  return (
    <div>
      <UserProfile />
      <TaskList />
      <ProjectList />
      <TaskForm />
    </div>
  );
}

function UserProfile() {
  // ユーザー情報の取得と表示のみ
  // ...
}

function TaskList() {
  // タスク一覧の取得と表示のみ
  // ...
}

function ProjectList() {
  // プロジェクト一覧の取得と表示のみ
  // ...
}

function TaskForm() {
  // フォーム処理のみ
  // ...
}
```

### ❌ 2. プレゼンテーショナルコンポーネントとコンテナコンポーネントの混在

**禁止事項**: データ取得と表示ロジックを同じコンポーネントに書くことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: データ取得と表示が混在
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // API呼び出し
    fetchUsers().then(setUsers);
  }, []);

  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: コンテナコンポーネントとプレゼンテーショナルコンポーネントを分離

// コンテナコンポーネント（データ取得）
function UserListContainer() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <UserList users={users} />;
}

// プレゼンテーショナルコンポーネント（表示のみ）
interface UserListProps {
  users: User[];
}

function UserList({ users }: UserListProps) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

### ❌ 3. インラインスタイルの多用

**禁止事項**: インラインスタイルを多用することは禁止です。保守性が低下します。

**禁止例**:

```typescript
// ❌ 禁止: インラインスタイルの多用
function UserCard({ user }: { user: User }) {
  return (
    <div style={{ padding: '16px', margin: '8px', backgroundColor: '#fff' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>{user.name}</h2>
      <p style={{ color: '#666', fontSize: '14px' }}>{user.email}</p>
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: CSS Modules または styled-components を使用

// CSS Modules の場合
import styles from './UserCard.module.css';

function UserCard({ user }: UserCardProps) {
  return (
    <div className={styles.card}>
      <h2 className={styles.title}>{user.name}</h2>
      <p className={styles.email}>{user.email}</p>
    </div>
  );
}

// styled-components の場合
import styled from 'styled-components';

const Card = styled.div`
  padding: 16px;
  margin: 8px;
  background-color: #fff;
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: bold;
`;

const Email = styled.p`
  color: #666;
  font-size: 14px;
`;

function UserCard({ user }: UserCardProps) {
  return (
    <Card>
      <Title>{user.name}</Title>
      <Email>{user.email}</Email>
    </Card>
  );
}
```

### ❌ 4. マジックナンバー/マジックストリングの使用

**禁止事項**: 数値や文字列を直接コードに書くことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: マジックナンバー/マジックストリング
function TaskCard({ task }: { task: Task }) {
  if (task.status === 'TODO') {
    return <div style={{ color: 'blue' }}>{task.title}</div>;
  }
  if (task.priority > 5) {
    return <div style={{ fontWeight: 'bold' }}>{task.title}</div>;
  }
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 定数として定義
const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;

type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

const Priority = {
  LOW: 1,
  MEDIUM: 3,
  HIGH: 5,
  URGENT: 7,
} as const;

const Colors = {
  TODO: '#3b82f6',
  IN_PROGRESS: '#f59e0b',
  DONE: '#10b981',
} as const;

function TaskCard({ task }: TaskCardProps) {
  if (task.status === TaskStatus.TODO) {
    return <div style={{ color: Colors.TODO }}>{task.title}</div>;
  }
  if (task.priority > Priority.HIGH) {
    return <div style={{ fontWeight: 'bold' }}>{task.title}</div>;
  }
}
```

---

## フック（Hooks）使用規約

### ❌ 1. 条件分岐内でのフック呼び出し

**禁止事項**: 条件分岐内でフックを呼び出すことは禁止です。React のルールに違反します。

**禁止例**:

```typescript
// ❌ 禁止: 条件分岐内でのフック呼び出し
function UserProfile({ userId }: { userId?: string }) {
  if (userId) {
    const [user, setUser] = useState<User | null>(null); // エラー
  }
  const [loading, setLoading] = useState(false);
  // ...
}
```

**推奨実装**:

```typescript
// ✅ 推奨: フックは常に同じ順序で呼び出す
function UserProfile({ userId }: { userId?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUser(userId).then(setUser);
    }
  }, [userId]);

  // ...
}
```

### ❌ 2. カスタムフックの命名規則違反

**禁止事項**: カスタムフックは `use` で始める必要があります。

**禁止例**:

```typescript
// ❌ 禁止: use で始まらない
function fetchUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  // ...
  return { user, loading };
}
```

**推奨実装**:

```typescript
// ✅ 推奨: use で始める
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    fetchUser(userId)
      .then(setUser)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [userId]);

  return { user, loading, error };
}
```

### ❌ 3. useEffect の依存配列の不備

**禁止事項**: `useEffect` の依存配列を適切に設定しないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 依存配列が空
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, []); // userId が変更されても再実行されない
}

// ❌ 禁止: 依存配列を省略
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }); // 毎回レンダリング時に実行される
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 依存配列を適切に設定
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]); // userId が変更されたときのみ再実行

  // ...
}

// ✅ 推奨: ESLint の exhaustive-deps ルールを有効にする
// .eslintrc.json
{
  "rules": {
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

### ❌ 4. useState の初期化関数の誤用

**禁止事項**: 高コストな計算を `useState` の初期値として直接書くことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 高コストな計算を直接書く
function ExpensiveComponent({ items }: { items: Item[] }) {
  const [filteredItems, setFilteredItems] = useState(
    items.filter(item => item.isActive) // 毎回レンダリング時に実行される
  );
  // ...
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 初期化関数を使用
function ExpensiveComponent({ items }: { items: Item[] }) {
  const [filteredItems, setFilteredItems] = useState(() =>
    items.filter(item => item.isActive) // 初回のみ実行される
  );
  // ...
}

// ✅ 推奨: useMemo を使用（依存関係がある場合）
function ExpensiveComponent({ items }: { items: Item[] }) {
  const filteredItems = useMemo(
    () => items.filter(item => item.isActive),
    [items]
  );
  // ...
}
```

---

## 状態管理規約

### ❌ 1. 不要な状態管理

**禁止事項**: 計算可能な値や props から導出できる値を状態として保持することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 計算可能な値を状態として保持
function TaskList({ tasks }: { tasks: Task[] }) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    setCompletedCount(tasks.filter(t => t.status === 'DONE').length);
  }, [tasks]);

  return <div>Completed: {completedCount}</div>;
}
```

**推奨実装**:

```typescript
// ✅ 推奨: useMemo を使用
function TaskList({ tasks }: { tasks: Task[] }) {
  const completedCount = useMemo(
    () => tasks.filter(t => t.status === TaskStatus.DONE).length,
    [tasks]
  );

  return <div>Completed: {completedCount}</div>;
}

// ✅ 推奨: 単純な計算の場合は直接計算
function TaskList({ tasks }: { tasks: Task[] }) {
  const completedCount = tasks.filter(t => t.status === TaskStatus.DONE).length;

  return <div>Completed: {completedCount}</div>;
}
```

### ❌ 2. 状態の持ち上げ（Lifting State Up）の不備

**禁止事項**: 複数のコンポーネントで共有する状態を適切に持ち上げないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 状態が分散している
function FilterInput() {
  const [filter, setFilter] = useState('');
  // ...
}

function TaskList() {
  const [filter, setFilter] = useState(''); // 同じ状態が重複
  // ...
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 状態を共通の親コンポーネントに持ち上げる
function TaskPage() {
  const [filter, setFilter] = useState('');

  return (
    <div>
      <FilterInput filter={filter} onFilterChange={setFilter} />
      <TaskList filter={filter} />
    </div>
  );
}

function FilterInput({ filter, onFilterChange }: FilterInputProps) {
  return (
    <input
      value={filter}
      onChange={e => onFilterChange(e.target.value)}
    />
  );
}

function TaskList({ filter }: TaskListProps) {
  const filteredTasks = useMemo(
    () => tasks.filter(t => t.title.includes(filter)),
    [tasks, filter]
  );
  // ...
}
```

### ❌ 3. グローバル状態の乱用

**禁止事項**: すべての状態をグローバル状態管理（Redux、Zustand など）に置くことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: ローカル状態をグローバル状態に置く
// store.ts
const store = createStore({
  modalIsOpen: false, // 1つのコンポーネントでのみ使用
  inputValue: '', // 1つのコンポーネントでのみ使用
  // ...
});
```

**推奨実装**:

```typescript
// ✅ 推奨: 必要な場合のみグローバル状態を使用
// グローバル状態: 認証情報、ユーザー情報、テーマ設定など
// ローカル状態: フォーム入力値、モーダルの開閉状態など

// store.ts - グローバル状態のみ
const store = createStore({
  user: null,
  theme: 'light',
  // ...
});

// Component.tsx - ローカル状態は useState を使用
function TaskForm() {
  const [title, setTitle] = useState(''); // ローカル状態
  const [description, setDescription] = useState(''); // ローカル状態
  const user = useSelector(state => state.user); // グローバル状態

  // ...
}
```

---

## イベントハンドリング規約

### ❌ 1. インライン関数の多用（パフォーマンス問題）

**禁止事項**: レンダリングごとに新しい関数が作成されるインライン関数を多用することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: インライン関数の多用
function TaskList({ tasks }: { tasks: Task[] }) {
  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => handleTaskClick(task.id)} // 毎回新しい関数が作成される
          onDelete={() => handleTaskDelete(task.id)} // 毎回新しい関数が作成される
        />
      ))}
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: useCallback を使用
function TaskList({ tasks }: { tasks: Task[] }) {
  const handleTaskClick = useCallback((taskId: string) => {
    // 処理
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    // 処理
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onClick={() => handleTaskClick(task.id)}
          onDelete={() => handleTaskDelete(task.id)}
        />
      ))}
    </div>
  );
}

// ✅ 推奨: データ属性を使用（より効率的）
function TaskList({ tasks }: { tasks: Task[] }) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const taskId = e.currentTarget.dataset.taskId;
    if (taskId) {
      // 処理
    }
  }, []);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          data-task-id={task.id}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}
```

### ❌ 2. イベントハンドラーの型定義の省略

**禁止事項**: イベントハンドラーの型定義を省略することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 型定義なし
const handleClick = (e) => { /* ... */ };
const handleChange = (e) => { /* ... */ };
const handleSubmit = (e) => { /* ... */ };
```

**推奨実装**:

```typescript
// ✅ 推奨: React の型を使用
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
  // ...
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  // ...
};

const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // ...
};
```

---

## パフォーマンス最適化規約

### ❌ 1. 不要な再レンダリング

**禁止事項**: 不要な再レンダリングを発生させることは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: オブジェクトや配列を直接 props に渡す
function Parent() {
  return (
    <Child
      config={{ theme: 'light', language: 'ja' }} // 毎回新しいオブジェクトが作成される
      items={[1, 2, 3]} // 毎回新しい配列が作成される
    />
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: useMemo を使用
function Parent() {
  const config = useMemo(
    () => ({ theme: 'light', language: 'ja' }),
    []
  );

  const items = useMemo(() => [1, 2, 3], []);

  return <Child config={config} items={items} />;
}

// ✅ 推奨: コンポーネント外で定義（変更されない場合）
const CONFIG = { theme: 'light', language: 'ja' } as const;
const ITEMS = [1, 2, 3] as const;

function Parent() {
  return <Child config={CONFIG} items={ITEMS} />;
}
```

### ❌ 2. React.memo の不適切な使用

**禁止事項**: すべてのコンポーネントに `React.memo` を適用することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: すべてのコンポーネントに memo を適用
const UserCard = React.memo(function UserCard({ user }: UserCardProps) {
  return <div>{user.name}</div>;
});

const Button = React.memo(function Button({ onClick }: ButtonProps) {
  return <button onClick={onClick}>Click</button>;
});
```

**推奨実装**:

```typescript
// ✅ 推奨: 必要な場合のみ memo を使用
// 1. レンダリングコストが高いコンポーネント
// 2. 頻繁に再レンダリングされるコンポーネント
// 3. props が頻繁に変更されないコンポーネント

const ExpensiveComponent = React.memo(function ExpensiveComponent({
  data,
}: ExpensiveComponentProps) {
  // 重い計算処理
  const processedData = useMemo(() => {
    return heavyCalculation(data);
  }, [data]);

  return <div>{/* ... */}</div>;
});

// シンプルなコンポーネントには memo は不要
function Button({ onClick }: ButtonProps) {
  return <button onClick={onClick}>Click</button>;
}
```

### ❌ 3. useMemo/useCallback の過剰使用

**禁止事項**: すべての計算や関数に `useMemo`/`useCallback` を適用することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: 過剰な最適化
function Component() {
  const count = useMemo(() => items.length, [items]); // 単純な計算
  const handleClick = useCallback(() => {
    console.log('clicked');
  }, []); // 依存関係がない単純な関数
  // ...
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 必要な場合のみ使用
// useMemo: 高コストな計算、オブジェクト/配列の作成
// useCallback: 子コンポーネントに渡す関数、依存関係がある関数

function Component() {
  const count = items.length; // 単純な計算はそのまま

  // 高コストな計算のみ useMemo
  const expensiveValue = useMemo(() => {
    return heavyCalculation(items);
  }, [items]);

  // 子コンポーネントに渡す関数のみ useCallback
  const handleClick = useCallback(() => {
    // 処理
  }, [dependency]);

  // ...
}
```

---

## スタイリング規約

### ❌ 1. インラインスタイルの多用

**禁止事項**: インラインスタイルを多用することは禁止です（前述）。

### ❌ 2. グローバル CSS の乱用

**禁止事項**: グローバル CSS でコンポーネント固有のスタイルを定義することは禁止です。

**禁止例**:

```css
/* ❌ 禁止: グローバル CSS でコンポーネント固有のスタイル */
.user-card {
  padding: 16px;
}

.task-item {
  margin: 8px;
}
```

**推奨実装**:

```typescript
// ✅ 推奨: CSS Modules を使用
// UserCard.module.css
.card {
  padding: 16px;
}

// UserCard.tsx
import styles from './UserCard.module.css';

function UserCard() {
  return <div className={styles.card}>...</div>;
}
```

### ❌ 3. クラス名のマジックストリング

**禁止事項**: クラス名を直接文字列で書くことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: クラス名を直接書く
function Component() {
  return <div className="user-card active">...</div>;
}
```

**推奨実装**:

```typescript
// ✅ 推奨: CSS Modules または clsx/classnames を使用
import styles from './Component.module.css';
import clsx from 'clsx';

function Component({ isActive }: ComponentProps) {
  return (
    <div className={clsx(styles.card, { [styles.active]: isActive })}>
      ...
    </div>
  );
}
```

---

## フォーム処理規約

### ❌ 1. 非制御コンポーネントの使用

**禁止事項**: 非制御コンポーネント（uncontrolled components）の使用は推奨されません。

**禁止例**:

```typescript
// ❌ 禁止: 非制御コンポーネント
function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRef.current?.value; // 型安全性が低い
    const password = passwordRef.current?.value;
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={emailRef} type="email" />
      <input ref={passwordRef} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 制御コンポーネント（controlled components）
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // email と password は型安全
    login({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}

// ✅ 推奨: react-hook-form を使用（より高度）
import { useForm } from 'react-hook-form';

interface LoginFormData {
  email: string;
  password: string;
}

function LoginForm() {
  const { register, handleSubmit } = useForm<LoginFormData>();

  const onSubmit = (data: LoginFormData) => {
    login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} type="email" />
      <input {...register('password', { required: true })} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

### ❌ 2. バリデーションの不備

**禁止事項**: クライアント側のバリデーションを適切に行わないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: バリデーションなし
function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser({ email, password }); // バリデーションなし
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} />
      <button type="submit">Create</button>
    </form>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: バリデーションを実装
function CreateUserForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    await createUser({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          aria-invalid={!!errors.email}
        />
        {errors.email && <span>{errors.email}</span>}
      </div>
      <div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          aria-invalid={!!errors.password}
        />
        {errors.password && <span>{errors.password}</span>}
      </div>
      <button type="submit">Create</button>
    </form>
  );
}

// ✅ 推奨: Zod + react-hook-form を使用（より型安全）
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

function CreateUserForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
  });

  const onSubmit = async (data: CreateUserFormData) => {
    await createUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} />
        {errors.email && <span>{errors.email.message}</span>}
      </div>
      <div>
        <input type="password" {...register('password')} />
        {errors.password && <span>{errors.password.message}</span>}
      </div>
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## API通信規約

### ❌ 1. fetch の直接使用

**禁止事項**: `fetch` を直接使用することは推奨されません。エラーハンドリングや型安全性が不十分です。

**禁止例**:

```typescript
// ❌ 禁止: fetch の直接使用
function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(data => setUsers(data)); // 型安全性なし、エラーハンドリングなし
  }, []);
}
```

**推奨実装**:

```typescript
// ✅ 推奨: API クライアント関数を作成
// api/client.ts
interface ApiError {
  message: string;
  code: string;
}

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
}

// api/users.ts
export async function getUsers(): Promise<User[]> {
  return apiRequest<User[]>('/users');
}

// Component.tsx
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    getUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* ... */}</div>;
}

// ✅ 推奨: React Query や SWR を使用（より高度）
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* ... */}</div>;
}
```

### ❌ 2. エラーハンドリングの不備

**禁止事項**: API 呼び出しのエラーハンドリングを適切に行わないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: エラーハンドリングなし
function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(setUsers); // エラーが発生しても処理されない
  }, []);
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 適切なエラーハンドリング
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        logger.error('Failed to fetch users', { error: error.message });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return <div>{/* ... */}</div>;
}
```

---

## エラーハンドリング規約

### ❌ 1. エラーを無視する

**禁止事項**: エラーを適切に処理せず、無視することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: エラーを無視
try {
  await createUser(data);
} catch (error) {
  // エラーを無視
}

// ❌ 禁止: any型でエラーを処理
try {
  await createUser(data);
} catch (error: any) {
  console.log(error.message); // any型を使用
}
```

**推奨実装**:

```typescript
// ✅ 推奨: 適切なエラーハンドリング
try {
  await createUser(data);
} catch (error) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error('Failed to create user', {
    error: err.message,
    stack: err.stack,
  });
  setError(err);
  // ユーザーにエラーメッセージを表示
}

// ✅ 推奨: エラーレスポンス型を定義
type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code: string };

async function safeCreateUser(
  data: CreateUserInput
): Promise<ApiResult<User>> {
  try {
    const user = await createUser(data);
    return { success: true, data: user };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create user', { error: err.message });
    return {
      success: false,
      error: err.message,
      code: 'CREATE_USER_FAILED',
    };
  }
}
```

### ❌ 2. エラーバウンダリの未実装

**禁止事項**: エラーバウンダリを実装しないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: エラーバウンダリなし
function App() {
  return (
    <div>
      <UserList />
      <TaskList />
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: エラーバウンダリを実装
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Error caught by boundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return <ErrorMessage error={this.state.error} />;
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div>
        <UserList />
        <TaskList />
      </div>
    </ErrorBoundary>
  );
}
```

---

## テスト規約

### ❌ 1. テストの未実装

**禁止事項**: 重要な機能にテストを書かないことは禁止です。

### ❌ 2. テストでの型安全性の無視

**禁止事項**: テストコードでも型安全性を無視することは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: any型を使用
test('renders user name', () => {
  const user: any = { name: 'John' };
  render(<UserCard user={user} />);
  // ...
});
```

**推奨実装**:

```typescript
// ✅ 推奨: 適切な型を使用
test('renders user name', () => {
  const user: User = {
    id: '1',
    name: 'John',
    email: 'john@example.com',
  };
  render(<UserCard user={user} />);
  expect(screen.getByText('John')).toBeInTheDocument();
});
```

---

## アクセシビリティ規約

### ❌ 1. セマンティックHTMLの不使用

**禁止事項**: セマンティックな HTML 要素を使用しないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: div を多用
function Navigation() {
  return (
    <div onClick={handleClick}>
      <div>Home</div>
      <div>About</div>
    </div>
  );
}
```

**推奨実装**:

```typescript
// ✅ 推奨: セマンティックな HTML を使用
function Navigation() {
  return (
    <nav>
      <ul>
        <li>
          <a href="/home">Home</a>
        </li>
        <li>
          <a href="/about">About</a>
        </li>
      </ul>
    </nav>
  );
}
```

### ❌ 2. ARIA属性の不備

**禁止事項**: 必要な場合に ARIA 属性を適切に設定しないことは禁止です。

**禁止例**:

```typescript
// ❌ 禁止: ARIA属性なし
function Modal({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null;
  return <div>Modal content</div>;
}
```

**推奨実装**:

```typescript
// ✅ 推奨: ARIA属性を適切に設定
function Modal({ isOpen, onClose }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div onClick={e => e.stopPropagation()}>
        <h2 id="modal-title">Modal Title</h2>
        <button aria-label="Close modal" onClick={onClose}>
          ×
        </button>
        <div>Modal content</div>
      </div>
    </div>
  );
}
```

---

## ファイル構成規約

### 推奨構成

```
src/
  components/
    UserCard/
      UserCard.tsx
      UserCard.module.css
      UserCard.test.tsx
      index.ts
    TaskList/
      TaskList.tsx
      TaskList.module.css
      TaskList.test.tsx
      index.ts
  hooks/
    useUser.ts
    useTask.ts
  api/
    client.ts
    users.ts
    tasks.ts
  types/
    user.ts
    task.ts
  utils/
    formatDate.ts
    validateEmail.ts
  constants/
    taskStatus.ts
    colors.ts
  App.tsx
  index.tsx
```

### ❌ 1. ファイル名の命名規則違反

**禁止事項**: コンポーネントファイル名は PascalCase、その他は camelCase を使用してください。

**禁止例**:

```
components/
  userCard.tsx  ❌
  task-list.tsx ❌
  utils.ts      ❌
```

**推奨実装**:

```
components/
  UserCard.tsx  ✅
  TaskList.tsx  ✅
utils/
  formatDate.ts ✅
```

---

## 命名規約

### ❌ 1. コンポーネント名の命名規則違反

**禁止事項**: コンポーネント名は PascalCase を使用してください。

**禁止例**:

```typescript
// ❌ 禁止: camelCase
function userCard() { /* ... */ }
const taskList = () => { /* ... */ }
```

**推奨実装**:

```typescript
// ✅ 推奨: PascalCase
function UserCard() { /* ... */ }
const TaskList = () => { /* ... */ }
```

### ❌ 2. 変数・関数名の命名規則違反

**禁止事項**: 変数・関数名は camelCase を使用してください。

**禁止例**:

```typescript
// ❌ 禁止: 命名規則違反
const UserName = 'John';
function GetUser() { /* ... */ }
const user_name = 'John';
```

**推奨実装**:

```typescript
// ✅ 推奨: camelCase
const userName = 'John';
function getUser() { /* ... */ }
```

### ❌ 3. 定数の命名規則違反

**禁止事項**: 定数は UPPER_SNAKE_CASE または camelCase（オブジェクトの場合）を使用してください。

**禁止例**:

```typescript
// ❌ 禁止: 命名規則違反
const maxLength = 100;
const apiUrl = 'https://api.example.com';
```

**推奨実装**:

```typescript
// ✅ 推奨: UPPER_SNAKE_CASE
const MAX_LENGTH = 100;
const API_URL = 'https://api.example.com';

// ✅ 推奨: オブジェクトの場合は camelCase + as const
const TaskStatus = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  DONE: 'DONE',
} as const;
```

---

## コメント・ドキュメント規約

### ❌ 1. 不要なコメント

**禁止事項**: コードから自明なコメントは不要です。

**禁止例**:

```typescript
// ❌ 禁止: 不要なコメント
// ユーザー名を設定
setUserName('John');

// カウントを増やす
setCount(count + 1);
```

**推奨実装**:

```typescript
// ✅ 推奨: コメントは「なぜ」を説明する
// ユーザー名は大文字で正規化する必要がある（API仕様）
setUserName(name.toUpperCase());

// カウントが上限に達した場合は処理をスキップ
if (count >= MAX_COUNT) return;
setCount(count + 1);
```

### ❌ 2. 複雑なロジックのコメント不足

**禁止事項**: 複雑なロジックにはコメントを書く必要があります。

**推奨実装**:

```typescript
// ✅ 推奨: 複雑なロジックにはコメントを書く
/**
 * タスクの優先度を計算する
 * 
 * 優先度は以下の要因で決定される:
 * 1. 期限までの日数（期限が近いほど高い）
 * 2. 依存タスクの完了状況（未完了の依存タスクがあると低い）
 * 3. プロジェクトの重要度
 * 
 * @param task - 優先度を計算するタスク
 * @returns 0-100の優先度スコア
 */
function calculateTaskPriority(task: Task): number {
  // 実装
}
```

---

## 実装チェックリスト

コード実装時には、以下を必ず確認してください：

### 型安全性
- [ ] `any`型を使用していない
- [ ] `as`型アサーションは最小限で、型ガードやバリデーションで代替できないか検討した
- [ ] Non-null assertion (`!`)を使用していない（明示的な null チェックを行っている）
- [ ] Props の型定義が明示されている
- [ ] イベントハンドラーの型が明示されている

### コンポーネント設計
- [ ] コンポーネントが200行を超えないように分割している
- [ ] プレゼンテーショナルコンポーネントとコンテナコンポーネントを分離している
- [ ] インラインスタイルを多用していない（CSS Modules や styled-components を使用）

### フック
- [ ] 条件分岐内でフックを呼び出していない
- [ ] カスタムフックは `use` で始まる名前になっている
- [ ] `useEffect` の依存配列を適切に設定している
- [ ] 高コストな計算は `useState` の初期化関数または `useMemo` を使用している

### 状態管理
- [ ] 計算可能な値を状態として保持していない
- [ ] 複数のコンポーネントで共有する状態は適切に持ち上げている
- [ ] グローバル状態は必要な場合のみ使用している

### パフォーマンス
- [ ] インライン関数の多用を避け、`useCallback` を適切に使用している
- [ ] 不要な再レンダリングを避けている（`React.memo`、`useMemo` を適切に使用）
- [ ] `useMemo`/`useCallback` を過剰に使用していない

### フォーム処理
- [ ] 制御コンポーネント（controlled components）を使用している
- [ ] バリデーションを適切に実装している

### API通信
- [ ] `fetch` を直接使用せず、API クライアント関数を作成している
- [ ] エラーハンドリングを適切に実装している

### エラーハンドリング
- [ ] エラーを無視せず、適切に処理・ログ出力している
- [ ] エラーバウンダリを実装している

### アクセシビリティ
- [ ] セマンティックな HTML 要素を使用している
- [ ] 必要な場合に ARIA 属性を適切に設定している

### その他
- [ ] マジックナンバー/マジックストリングを使用せず、定数として定義している
- [ ] ファイル名の命名規則に従っている
- [ ] コンポーネント名は PascalCase、変数・関数名は camelCase を使用している
- [ ] 不要なコメントを書いていない（「なぜ」を説明するコメントのみ）
- [ ] 複雑なロジックにはコメントを書いている

---

この規約に従うことで、型安全で保守性の高いフロントエンドコードを実装できます。
