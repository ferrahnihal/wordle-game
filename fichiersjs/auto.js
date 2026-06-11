
    let MOTS = []; // Ce tableau sera rempli dynamiquement par le fichier mots.txt
    let motSecret = "";
    let tentative = 0;
    let fini = false;
    let paused = false;

    // ===== CHARGEMENT DYNAMIQUE DES MOTS =====
    async function chargerMotsEtLancer() {
      try {
        // On remonte d'un dossier (../) car mots.txt est à la racine de XAMPP /wordle/
        const reponse = await fetch('../mots.txt');
        
        if (!reponse.ok) {
          throw new Error("Impossible de charger le fichier mots.txt");
        }

        const texte = await reponse.text();
        const lignes = texte.split(/\r?\n/);
        
        // On nettoie et filtre pour ne garder que les mots de 5 lettres
        MOTS = lignes
          .map(mot => mot.trim())
          .filter(mot => mot.length === 5);

        if (MOTS.length === 0) {
          showMessage("Erreur : Aucun mot de 5 lettres trouvé.", "lose");
          return;
        }

        // Lance la simulation dès que les mots sont prêts en mémoire
        startAutoPlayer();

      } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
        showMessage("Erreur de chargement du dictionnaire.", "lose");
      }
    }

    // ===== INITIALISATION =====
    function initGame() {
      if (MOTS.length === 0) return;

      // Choix du mot secret au hasard
      motSecret = MOTS[Math.floor(Math.random() * MOTS.length)].toUpperCase();
      console.log("Le robot doit deviner : " + motSecret);

      tentative = 0;
      fini = false;
      paused = false;

      const grid = document.getElementById('grid');
      if (grid) {
        grid.innerHTML = '';
        for (let r = 0; r < 6; r++) {
          const row = document.createElement('div');
          row.className = 'row';
          row.id = 'row-' + r;

          for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.id = `cell-${r}-${c}`;
            row.appendChild(cell);
          }
          grid.appendChild(row);
        }
      }

      if (document.getElementById('message')) {
        document.getElementById('message').textContent = '';
        document.getElementById('message').className = '';
      }
      
      if (document.getElementById('essais-label')) {
        document.getElementById('essais-label').textContent = '6 essais';
      }

      // Configuration des boutons au démarrage
      if (document.getElementById('btn-rejouer')) document.getElementById('btn-rejouer').style.display = 'none';
      if (document.getElementById('btn-pause')) {
        document.getElementById('btn-pause').style.display = 'inline-block';
        document.getElementById('btn-pause').textContent = '⏸ Pause';
      }
    }

    // ===== COLORATION =====
    function colorRow(row, guess) {
      const secret = motSecret.split('');
      const result = Array(5).fill('gray');
      const used = Array(5).fill(false);

      // Étape 1 : Lettres bien placées (Vert)
      for (let i = 0; i < 5; i++) {
        if (guess[i] === secret[i]) {
          result[i] = 'green';
          used[i] = true;
        }
      }

      // Étape 2 : Lettres présentes mais mal placées (Jaune)
      for (let i = 0; i < 5; i++) {
        if (result[i] === 'green') continue;
        for (let j = 0; j < 5; j++) {
          if (!used[j] && guess[i] === secret[j]) {
            result[i] = 'yellow';
            used[j] = true;
            break;
          }
        }
      }

      // Étape 3 : Application visuelle des classes CSS sur les cases
      for (let i = 0; i < 5; i++) {
        const cell = document.getElementById(`cell-${row}-${i}`);
        if (cell) cell.classList.add(result[i]);
      }
    }

    // ===== MESSAGE =====
    function showMessage(msg, type='info') {
      const el = document.getElementById('message');
      if (el) {
        el.textContent = msg;
        el.className = type;
      }
    }

    // ===== FIN DE PARTIE =====
    function endGame() {
      fini = true;
      if (document.getElementById('btn-rejouer')) document.getElementById('btn-rejouer').style.display = 'inline-block';
      if (document.getElementById('btn-pause')) document.getElementById('btn-pause').style.display = 'none';
    }

    // ===== GESTION DES PAUSES / ATTENTES =====
    function sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }

    function togglePause() {
      paused = !paused;
      const btn = document.getElementById("btn-pause");
      if (btn) btn.textContent = paused ? "▶ Reprendre" : "⏸ Pause";
    }

    async function waitIfPaused() {
      while (paused) {
        await sleep(100);
      }
    }

    // ===== SIMULATION DE LA FRAPPE (LETTRE PAR LETTRE) =====
    async function typeWord(row, guess) {
      for (let i = 0; i < 5; i++) {
        await waitIfPaused();
        const cell = document.getElementById(`cell-${row}-${i}`);
        if (cell) {
          cell.textContent = guess[i];
          cell.classList.add("typing");
        }
        await sleep(600);
        if (cell) cell.classList.remove("typing");
      }
    }

    // ===== LOGIQUE DE L'AUTO PLAYER =====
    async function startAutoPlayer() {
      // Réinitialise la grille et choisit un nouveau mot secret
      initGame();

      // On crée une copie mélangée du dictionnaire pour simuler les essais du robot
      let essais = [...MOTS];
      essais.sort(() => Math.random() - 0.5);

      for (let i = 0; i < 6; i++) {
        if (fini) return;

        await waitIfPaused();
        const guess = essais[i].toUpperCase();

        showMessage("L'ordinateur réfléchit...");
        await sleep(1000);

        // Animation d'écriture
        await typeWord(tentative, guess);
        await waitIfPaused();
        await sleep(800);

        // Coloration des cases après validation
        colorRow(tentative, guess);
        tentative++;

        // Mise à jour du compteur d'essais restants
        const restants = 6 - tentative;
        const label = document.getElementById('essais-label');
        if (label) {
          label.textContent = restants + (restants === 1 ? ' essai' : ' essais');
        }

        await sleep(1200);

        // Condition de Victoire
        if (guess === motSecret) {
          showMessage("L'ordinateur a trouvé 🎉", "win");
          endGame();
          return;
        }
      }

      // Condition de Défaite si les 6 essais sont épuisés
      showMessage("Perdu ! Le mot était : " + motSecret, "lose");
      endGame();
    }

    // Lancement automatique du script au chargement de la page par le navigateur
    window.addEventListener('DOMContentLoaded', () => {
      chargerMotsEtLancer();
    });