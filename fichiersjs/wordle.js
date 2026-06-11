
    let MOTS = []; 
    let motSecret = "", tentative = 0, fini = false;

    async function chargerMots() {
      try {
        // CORRIGÉ : On remonte d'un dossier avec ../ car mots.txt est à la racine
        const reponse = await fetch('../mots.txt');
        
        if (!reponse.ok) {
          throw new Error("Impossible de charger le fichier mots.txt");
        }

        const texte = await reponse.text();
        const lignes = texte.split(/\r?\n/);
        
        // On ne garde que les mots de 5 lettres
        MOTS = lignes
          .map(mot => mot.trim())
          .filter(mot => mot.length === 5);

        if (MOTS.length === 0) {
          showMessage("Erreur : Aucun mot de 5 lettres trouvé.", "lose");
          return;
        }

        initGame();

      } catch (erreur) {
        console.error("Erreur de chargement :", erreur);
        showMessage("Erreur de chargement du dictionnaire.", "lose");
      }
    }

    function initGame() {
      if (MOTS.length === 0) return;

      motSecret = MOTS[Math.floor(Math.random() * MOTS.length)].toUpperCase();
      tentative = 0; fini = false;
      
      console.log("Le mot à deviner est : " + motSecret);

      const grid = document.getElementById('grid');
      if (grid) {
        grid.innerHTML = '';
        for (let r = 0; r < 6; r++) {
          const row = document.createElement('div');
          row.className = 'row'; row.id = 'row-' + r;
          for (let c = 0; c < 5; c++) {
            const cell = document.createElement('div');
            cell.className = 'cell'; cell.id = `cell-${r}-${c}`;
            row.appendChild(cell);
          }
          grid.appendChild(row);
        }
      }
      
      if(document.getElementById('message')) {
        document.getElementById('message').textContent = '';
        document.getElementById('message').className = '';
      }
      
      const input = document.getElementById('word-input');
      if (input) {
        input.value = '';
        input.disabled = false;
        input.focus();
      }
      
      if(document.getElementById('btn-rejouer')) document.getElementById('btn-rejouer').style.display = 'none';
      if(document.getElementById('essais-label')) document.getElementById('essais-label').textContent = '6 essais';
    }

    function submitGuess() {
      if (fini) return;
      const input = document.getElementById('word-input');
      if (!input) return;
      
      const guess = input.value.toUpperCase().trim();
      if (guess.length !== 5) { showMessage("Entre un mot de 5 lettres !", "info"); return; }
      
      colorRow(tentative, guess);
      tentative++;
      
      const restants = 6 - tentative;
      if(document.getElementById('essais-label')) {
        document.getElementById('essais-label').textContent = restants + (restants === 1 ? ' essai' : ' essais');
      }
      
      if (guess === motSecret) { showMessage("Bravo ! Tu as trouvé 🎉", "win"); endGame(); return; }
      if (tentative === 6) { showMessage("Perdu ! Le mot était : " + motSecret, "lose"); endGame(); return; }
      
      input.value = ''; 
      input.focus();
    }

    function colorRow(row, guess) {
      const secret = motSecret.split('');
      const result = Array(5).fill('gray');
      const used = Array(5).fill(false);
      
      for (let i = 0; i < 5; i++) { if (guess[i] === secret[i]) { result[i] = 'green'; used[i] = true; } }
      for (let i = 0; i < 5; i++) {
        if (result[i] === 'green') continue;
        for (let j = 0; j < 5; j++) { if (!used[j] && guess[i] === secret[j]) { result[i] = 'yellow'; used[j] = true; break; } }
      }
      for (let i = 0; i < 5; i++) {
        const cell = document.getElementById(`cell-${row}-${i}`);
        if (cell) {
          cell.textContent = guess[i]; 
          cell.classList.add(result[i]);
        }
      }
    }

    function showMessage(msg, type='info') {
      const el = document.getElementById('message');
      if (el) { el.textContent = msg; el.className = type; }
    }

    function endGame() {
      fini = true;
      const input = document.getElementById('word-input');
      if (input) input.disabled = true;
      if(document.getElementById('btn-rejouer')) document.getElementById('btn-rejouer').style.display = 'inline-block';
    }

    // Événement pour valider avec la touche Entrée
    document.addEventListener('keydown', e => { if (e.key === 'Enter') submitGuess(); });

    // Sécurité : On attend que toute la structure HTML soit prête avant d'activer le script
    window.addEventListener('DOMContentLoaded', () => {
      const input = document.getElementById('word-input');
      if (input) {
        input.addEventListener('input', function() {
          const val = this.value.toUpperCase();
          for (let i = 0; i < 5; i++) {
            const cell = document.getElementById(`cell-${tentative}-${i}`);
            if (!cell) return;
            if (!cell.classList.contains('green') && !cell.classList.contains('yellow') && !cell.classList.contains('gray')) {
              cell.textContent = val[i] || '';
              cell.classList.toggle('filled', !!val[i]);
            }
          }
        });
      }
      
      // On lance le chargement
      chargerMots();
    });