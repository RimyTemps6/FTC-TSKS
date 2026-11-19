# FTC Quest

Site de estudo de FTC (Java, hardware, Pedro Pathing) com login Google, nível inicial,
perfil, amigos, chat e sequência diária.

## Estrutura
```
index.html          página
style.css           visual
data.js             trilhas, lições e guias
placement.js        questionário + mini prova de nível
app.js              lógica (Firebase, telas, chat, amigos)
firebase-config.js  configuração do seu projeto Firebase
```

## Configurar o Firebase (uma vez)
1. **Authentication → Sign-in method**: ative **Google**.
2. **Authentication → Settings → Authorized domains**: adicione `SEU-USUARIO.github.io`.
   (`localhost` já vem autorizado.)
3. **Firestore Database → Regras**: cole o conteúdo de `firestore.rules` e clique em **Publicar**.

## Publicar no GitHub Pages
1. Suba esta pasta para o repositório.
2. **Settings → Pages → Deploy from a branch** e escolha a branch (e a pasta `/ (root)` ou `/docs`).
3. O endereço fica `https://SEU-USUARIO.github.io/REPO/` (ou `.../REPO/ftc-quest/` se a pasta for uma subpasta).

## Testar no computador
O login com Google e os módulos ES não funcionam abrindo o arquivo direto (`file://`). Use:
```
python3 -m http.server 8000
```
e abra `http://localhost:8000`.
