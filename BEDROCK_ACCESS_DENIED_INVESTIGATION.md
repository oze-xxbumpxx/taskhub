# LambdaからBedrock実行時のAccessDeniedException 調査ガイド

## 概要
Lambda関数からAmazon Bedrockを呼び出す際に`AccessDeniedException`が発生した場合の原因調査チェックリストです。

## 考えられる原因と確認方法

### 1. IAMロールの権限不足 ⭐ 最も一般的

**確認ポイント:**
- Lambda関数にアタッチされているIAMロールにBedrockへのアクセス権限があるか
- 必要なアクションが許可されているか

**必要なIAMポリシー例:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": "arn:aws:bedrock:*::foundation-model/*"
    }
  ]
}
```

**確認方法:**
```bash
# Lambda関数のIAMロール名を確認
aws lambda get-function --function-name <関数名> --query 'Configuration.Role'

# IAMロールにアタッチされているポリシーを確認
aws iam list-attached-role-policies --role-name <ロール名>
aws iam get-policy-version --policy-arn <ポリシーARN> --version-id <バージョンID>
```

**よくある問題:**
- `bedrock:*` のようなワイルドカード権限は、Bedrockではリソースベースのポリシーが必要な場合がある
- `bedrock:InvokeModel` が不足している
- 特定のモデルARNへのアクセス権限が不足している

---

### 2. Bedrockサービスの有効化不足

**確認ポイント:**
- AWSアカウントでBedrockサービスが有効化されているか
- 使用しようとしているモデル（例: Claude, Llama等）が有効化されているか

**確認方法:**
```bash
# Bedrockの利用可能なモデルを確認
aws bedrock list-foundation-models --region <リージョン>

# 特定のモデルの詳細を確認
aws bedrock get-foundation-model --model-identifier <モデルID> --region <リージョン>
```

**よくある問題:**
- Bedrockサービス自体が有効化されていない（初回利用時）
- 特定のモデル（例: Claude 3 Sonnet）が有効化されていない
- リージョンによって利用可能なモデルが異なる

---

### 3. リージョンの不一致

**確認ポイント:**
- Lambda関数とBedrockのリージョンが一致しているか
- SDKのデフォルトリージョン設定が正しいか

**確認方法:**
```bash
# Lambda関数のリージョンを確認
aws lambda get-function --function-name <関数名> --query 'Configuration.FunctionArn'

# コード内でのリージョン指定を確認
# AWS SDK v3の場合:
const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });
```

**よくある問題:**
- Lambda関数が`ap-northeast-1`にあるが、Bedrockの呼び出しが`us-east-1`を指定している
- 環境変数やデフォルト設定でリージョンが異なる
- 一部のモデルは特定のリージョンでのみ利用可能

---

### 4. VPC設定によるネットワークアクセス問題

**確認ポイント:**
- Lambda関数がVPC内で実行されている場合、Bedrockへのアクセスが可能か
- NAT GatewayやVPCエンドポイントが適切に設定されているか

**確認方法:**
```bash
# Lambda関数のVPC設定を確認
aws lambda get-function-configuration --function-name <関数名> --query 'VpcConfig'

# VPCエンドポイントの設定を確認（Bedrock用）
aws ec2 describe-vpc-endpoints --filters "Name=service-name,Values=com.amazonaws.*.bedrock-runtime"
```

**よくある問題:**
- VPC内のLambdaからインターネット経由でBedrockにアクセスしようとしているが、NAT Gatewayがない
- Bedrock用のVPCエンドポイントが設定されていない
- セキュリティグループでアウトバウンドトラフィックが制限されている

**解決策:**
- NAT Gatewayを設定する
- Bedrock用のVPCエンドポイントを作成する（推奨）
- Lambda関数をVPC外で実行する（可能な場合）

---

### 5. リソースポリシー（Resource Policy）の問題

**確認ポイント:**
- Bedrockモデルにリソースベースのポリシーが設定されていて、Lambdaのロールが許可されているか

**確認方法:**
```bash
# Bedrockモデルのリソースポリシーを確認（該当する場合）
# 注意: 多くのBedrockモデルはリソースポリシーを持たない
```

**よくある問題:**
- カスタムモデルや特定の設定でリソースポリシーが設定されている場合、IAMロールが許可されていない

---

### 6. 認証情報の問題

**確認ポイント:**
- Lambda関数が正しいIAMロールを使用しているか
- 一時的な認証情報の有効期限が切れていないか

**確認方法:**
```bash
# Lambda関数内で実行中のロールを確認
# コード内で:
const sts = new STSClient({});
const identity = await sts.send(new GetCallerIdentityCommand({}));
console.log('実行中のロール:', identity.Arn);
```

**よくある問題:**
- Lambda関数が異なるIAMロールを使用している
- ローカル開発環境で異なる認証情報を使用している

---

### 7. モデルIDの誤り

**確認ポイント:**
- 呼び出そうとしているモデルIDが正しいか
- モデルARNの形式が正しいか

**正しい形式の例:**
```
# モデルID
anthropic.claude-v2
anthropic.claude-3-sonnet-20240229-v1:0

# 完全なARN
arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-v2
```

**確認方法:**
```bash
# 利用可能なモデル一覧を取得
aws bedrock list-foundation-models --region <リージョン> --query 'modelSummaries[*].[modelId,modelName]' --output table
```

---

### 8. AWS SDKのバージョンや設定の問題

**確認ポイント:**
- AWS SDKのバージョンが適切か
- SDKの設定（リージョン、認証情報）が正しいか

**確認方法:**
```typescript
// AWS SDK v3の場合の正しい設定例
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  // 認証情報は自動的にLambdaの実行ロールから取得される
});
```

**よくある問題:**
- AWS SDK v2とv3でAPIが異なる
- リージョンが明示的に設定されていない
- 古いSDKバージョンを使用している

---

## デバッグ手順（推奨順）

### Step 1: IAMロールの確認
1. Lambda関数のIAMロール名を確認
2. アタッチされているポリシーを確認
3. `bedrock:InvokeModel` 権限があるか確認

### Step 2: CloudWatch Logsでエラー詳細を確認
```bash
# Lambda関数のログを確認
aws logs tail /aws/lambda/<関数名> --follow
```

エラーメッセージに含まれる情報:
- どの権限が不足しているか
- どのリソースへのアクセスが拒否されたか

### Step 3: Bedrockサービスの有効化確認
1. AWSコンソールでBedrockサービスにアクセス
2. 使用したいモデルが有効化されているか確認
3. リージョンが正しいか確認

### Step 4: コード内の設定確認
1. リージョン設定が正しいか
2. モデルIDが正しいか
3. AWS SDKのバージョンと使用方法が正しいか

### Step 5: VPC設定の確認（該当する場合）
1. Lambda関数がVPC内で実行されているか確認
2. NAT GatewayまたはVPCエンドポイントが設定されているか確認

---

## よくあるエラーメッセージと対処法

### "User: arn:aws:sts::ACCOUNT:assumed-role/ROLE/Lambda is not authorized to perform: bedrock:InvokeModel"
**原因:** IAMロールに`bedrock:InvokeModel`権限がない  
**対処:** IAMロールにBedrockのInvokeModel権限を追加

### "The model you requested is not available"
**原因:** モデルが有効化されていない、またはリージョンが間違っている  
**対処:** Bedrockコンソールでモデルを有効化、または正しいリージョンを指定

### "Unable to locate credentials"
**原因:** Lambda関数がIAMロールを持っていない、または認証情報の設定が間違っている  
**対処:** Lambda関数にIAMロールをアタッチ

### "AccessDeniedException: Unable to access the model"
**原因:** 複合的な問題（権限 + モデル有効化 + リージョン等）  
**対処:** 上記の各項目を順番に確認

---

## 実装時のベストプラクティス

### 1. IAMポリシーの最小権限の原則
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-sonnet-*",
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-v2*"
      ]
    }
  ]
}
```

### 2. エラーハンドリングの実装
```typescript
try {
  const response = await bedrockClient.send(new InvokeModelCommand({
    modelId: 'anthropic.claude-v2',
    body: JSON.stringify({ prompt: 'Hello' }),
    contentType: 'application/json',
    accept: 'application/json',
  }));
} catch (error) {
  if (error.name === 'AccessDeniedException') {
    console.error('Bedrockへのアクセスが拒否されました:', error.message);
    // IAMロールの権限を確認してください
  } else if (error.name === 'ValidationException') {
    console.error('リクエストの形式が不正です:', error.message);
  } else {
    console.error('予期しないエラー:', error);
  }
}
```

### 3. リージョン設定の環境変数化
```typescript
const BEDROCK_REGION = process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
const bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });
```

---

## 参考リンク

- [AWS Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/)
- [IAM ポリシーの例](https://docs.aws.amazon.com/bedrock/latest/userguide/security_iam_id-based-policy-examples.html)
- [Lambda から Bedrock を呼び出す](https://docs.aws.amazon.com/bedrock/latest/userguide/inference-examples.html)
- [VPC エンドポイントの設定](https://docs.aws.amazon.com/bedrock/latest/userguide/vpc.html)
