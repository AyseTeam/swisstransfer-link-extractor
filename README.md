# SwissTransfer Link Extractor 🚀

A lightweight and elegant browser extension that automatically redirects you 🚀 when an upload is complete and directly extracts download links 🔗 from SwissTransfer without unnecessary clicks.

*(🇫🇷 Vous parlez français ? Déroulez la section en bas de page !)*

## Demo / Démo 🎥

https://github.com/user-attachments/assets/17f0adfa-7288-4078-be7c-5520ba094a98

## ✨ Features

* **Auto-Redirect:** Automatically navigates to the download page once your upload is finished. No need to wait and click manually!
* **Direct Links Extraction:** Intercepts network requests to extract the raw, direct download links for your files.
* **Modern GUI:** Displays the extracted links in a beautiful, glassmorphism-styled floating panel.
* **Smart Language Detection:** Automatically adapts the interface to your browser's language (supports French & English).
* **One-Click Copy:** Easily copy download links to your clipboard.

## 🛠️ How it works

1. **Upload:** When you upload files on SwissTransfer, the extension monitors the process and immediately redirects you to the download link once completed.
2. **Download Page:** By intercepting `XMLHttpRequest` and `Fetch` API calls, the extension captures the underlying API responses containing the direct file links.
3. **Extraction:** It dynamically creates a modern, floating interface on the page where you can copy the links or download the files directly.

## 📦 Installation (Developer Mode)

1. Clone or download this repository.
2. Open your browser's extension page (e.g., `chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the folder containing this extension.

---

<details>
<summary>🇫🇷 <b>Version Française</b></summary>

## ✨ Fonctionnalités

* **Redirection Automatique :** Navigue automatiquement vers la page de téléchargement une fois l'upload terminé. Plus besoin d'attendre et de cliquer !
* **Extraction des Liens :** Intercepte les requêtes réseau pour extraire les liens de téléchargement directs de vos fichiers.
* **Interface Moderne :** Affiche les liens extraits dans un magnifique panneau flottant au style "glassmorphism".
* **Détection de Langue :** Adapte automatiquement l'interface à la langue de votre navigateur (Français & Anglais).
* **Copie en un clic :** Copiez facilement les liens dans votre presse-papiers.

## 🛠️ Comment ça marche

1. **Upload :** Lors de l'envoi de fichiers, l'extension surveille le processus et vous redirige immédiatement vers le lien de téléchargement une fois terminé.
2. **Page de téléchargement :** En interceptant les appels API `XMLHttpRequest` et `Fetch`, l'extension capture les réponses contenant les liens directs.
3. **Extraction :** Elle crée dynamiquement une interface moderne sur la page pour copier les liens ou télécharger les fichiers directement.

## 📦 Installation (Mode Développeur)

1. Clonez ou téléchargez ce dépôt.
2. Ouvrez la page des extensions de votre navigateur (ex: `chrome://extensions/` ou `edge://extensions/`).
3. Activez le **Mode développeur** en haut à droite.
4. Cliquez sur **Charger l'extension non empaquetée** et sélectionnez le dossier contenant cette extension.

</details>

---

### 🤝 Contributing

Found a bug or have a better method?
* Open an **Issue**.
* Submit a **Pull Request**.

---

### 📜 License & Credits

* **Developer:** [@AyseTeam](https://github.com/AyseTeam)
* **License:** Educational purposes only. Use responsibly.

---

**Don't forget to ⭐ this repository if it helped you!**
