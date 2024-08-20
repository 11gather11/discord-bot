# Description: Dockerfile for bun
FROM oven/bun:latest

# 作業ディレクトリを設定
WORKDIR /ts-meo-discord

# package.jsonとbun.lockbをコピー
COPY package.json ./
COPY bun.lockb ./

# 依存関係をインストール
RUN bun install

# ソースコードをコピー
COPY ./src ./

# コンテナ起動時に実行されるコマンド
CMD ["bun", "src/index.ts"]
