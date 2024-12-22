# Eliza 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="Eliza Banner" width="100%" />
</div>

<div align="center">

📖 [Documentation](https://ai16z.github.io/eliza/) | 🎯 [Examples](https://github.com/thejoven/awesome-eliza)

</div>

## 🌍 README Translations

[中文说明](./README_CN.md) | [日本語の説明](./README_JA.md) | [한국어 설명](./README_KOR.md) | [Français](./README_FR.md) | [Português](./README_PTBR.md) | [Türkçe](./README_TR.md) | [Русский](./README_RU.md) | [Español](./README_ES.md) | [Italiano](./README_IT.md)

## ✨ Features

- 🛠️ Full-featured Discord, Twitter and Telegram connectors
- 🔗 Support for every model (Llama, Grok, OpenAI, Anthropic, etc.)
- 👥 Multi-agent and room support
- 📚 Easily ingest and interact with your documents
- 💾 Retrievable memory and document store
- 🚀 Highly extensible - create your own actions and clients
- ☁️ Supports many models (local Llama, OpenAI, Anthropic, Groq, etc.)
- 📦 Just works!

## 🎯 Use Cases

- 🤖 Chatbots
- 🕵️ Autonomous Agents
- 📈 Business Process Handling
- 🎮 Video Game NPCs
- 🧠 Trading

## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

> **Note for Windows Users:** [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install-manual) is required.

### Use the Starter (Recommended)

```bash
git clone https://github.com/ai16z/eliza-starter.git

cp .env.example .env

pnpm i && pnpm start
```

Then read the [Documentation](https://ai16z.github.io/eliza/) to learn how to customize your Eliza.

### Manually Start Eliza (Only recommended if you know what you are doing)

```bash
# Clone the repository
git clone https://github.com/ai16z/eliza.git

# Checkout the latest release
# This project iterates fast, so we recommend checking out the latest release
git checkout $(git describe --tags --abbrev=0)
```

### Start Eliza with Gitpod

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/ai16z/eliza/tree/main)

### Edit the .env file

Copy .env.example to .env and fill in the appropriate values.

```
cp .env.example .env
```

Note: .env is optional. If your planning to run multiple distinct agents, you can pass secrets through the character JSON

### Automatically Start Eliza

This will run everything to setup the project and start the bot with the default character.

```bash
sh scripts/start.sh
```

### Edit the character file

1. Open `agent/src/character.ts` to modify the default character. Uncomment and edit.

2. To load custom characters:
    - Use `pnpm start --characters="path/to/your/character.json"`
    - Multiple character files can be loaded simultaneously
3. Connect with X (Twitter)
    - change `"clients": []` to `"clients": ["twitter"]` in the character file to connect with X

### Manually Start Eliza

```bash
pnpm i
pnpm build
pnpm start

# The project iterates fast, sometimes you need to clean the project if you are coming back to the project
pnpm clean
```

#### Additional Requirements

You may need to install Sharp. If you see an error when starting up, try installing it with the following command:

```
pnpm install --include=optional sharp
```

### Community & contact

- [GitHub Issues](https://github.com/ai16z/eliza/issues). Best for: bugs you encounter using Eliza, and feature proposals.
- [Discord](https://discord.gg/ai16z). Best for: sharing your applications and hanging out with the community.

## Contributors

<a href="https://github.com/ai16z/eliza/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=ai16z/eliza" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ai16z/eliza&type=Date)](https://star-history.com/#ai16z/eliza&Date)

## 🚀 Deployment to DigitalOcean

Follow these steps to deploy Eliza on a DigitalOcean droplet:

### 1. Create a New Droplet

- Log in to DigitalOcean dashboard
- Click "Create" > "Droplets"
- Choose Ubuntu as the operating system
- Select Basic plan
- Choose the `basic-xxs` size (cheapest option)
- Choose a datacenter region (any is fine)
- Create a root password or SSH key
- Click "Create Droplet"

### 2. Access the Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Upload Setup Script

```bash
# Create the setup script
nano rsai-setup.sh

# Copy/paste contents of rsai-setup.sh

# Make the script executable
chmod +x rsai-setup.sh
```

### 4. Run Setup Script

```bash
./rsai-setup.sh
```

This will:

- Install all necessary dependencies (Node.js, pnpm, Git, PM2)
- Clone the repository
- Set up environment variables
- Build the project
- Configure PM2 for process management

### 5. Verify Installation

```bash
# Check process status
pm2 status

# Check logs
pm2 logs rsai

# Monitor the application
pm2 monit
```

### 6. Setup Domain (Optional)

- In DigitalOcean dashboard, go to "Networking"
- Add your domain and create an A record pointing to your droplet's IP

### 7. Maintenance Commands

```bash
# Restart the application
pm2 restart rsai

# View real-time monitoring
pm2 monit

# Update system packages
sudo apt update && sudo apt upgrade
```

### 8. Updating the Application

```bash
# Stop the current process
pm2 stop rsai

# Navigate to app directory
cd ~/app

# Pull the latest changes
git pull origin rsai

# Install any new dependencies
pnpm install

# Rebuild the application
pnpm run build

# Restart the process
pm2 restart rsai

# Check the logs to ensure successful restart
pm2 logs rsai
```

Remember to:

- Keep your environment variables secure
- Regularly update the system
- Monitor the application's performance and logs
- Backup your data regularly

```

```
