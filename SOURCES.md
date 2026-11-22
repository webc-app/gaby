# Sources et licences

Le **code** de Gaby est sous licence MIT (fichier `LICENSE`).
Le **contenu pédagogique** écrit pour l'app (`contenu/` : questions, mots, phrases, réécritures des contes) est sous
licence [Creative Commons BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fr) : libre d'usage et de
modification, en citant Gaby.

Tout le reste vient de sources libres, listées ci-dessous. Rien n'est chargé depuis un autre site : tout est dans le dépôt.

## Textes de lecture (`contenu/lecture/`)

- Fables de **Jean de La Fontaine** (1668) : texte original, domaine public.
- Contes de **Perrault**, des **frères Grimm**, d'**Andersen**, d'**Ésope** et contes traditionnels : réécrits pour
  l'app (versions courtes pour enfants), sous la même licence que le reste du contenu.

## Images

- **Avatars** (`public/avatars/`) : style « Voxel Art » de [DiceBear](https://www.dicebear.com/styles/voxel-art/),
  licence [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) (domaine public).
- **Drapeaux** (`src/drapeaux/`) : [Flagpedia](https://flagpedia.net), d'après Wikimedia Commons, domaine public.
  Voir `src/drapeaux/SOURCE.md`.
- **Panneaux du code de la route** (`src/panneaux/`) : modèles officiels des signaux routiers français, publiés au
  format SVG par le [Cerema](https://equipementsdelaroute.cerema.fr/signaux-au-format-svg-a654.html).
  Voir `src/panneaux/SOURCE.md`.
- **Planètes** (`src/planetes/`) : photos de Wikimedia Commons. Celles de la NASA sont dans le domaine public ; deux
  demandent de citer l'auteur :
  - la Lune : © Gregory H. Revera, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.fr) ;
  - Mars : © ESA & MPS for OSIRIS Team MPS/UPD/LAM/IAA/RSSD/INTA/UPM/DASP/IDA,
    [CC BY-SA 3.0 IGO](https://creativecommons.org/licenses/by-sa/3.0/igo/deed.fr).

  Voir `src/planetes/SOURCE.md`.

## Polices (`public/polices/`)

- **Andika** (SIL International), dessinée pour les enfants qui apprennent à lire.
- **Playwrite FR Moderne** (TypeTogether), l'écriture attachée de l'école française.

Toutes deux sous [SIL Open Font License 1.1](https://openfontlicense.org).

## Voix (`public/dictee/`, `public/anglais/`)

Les sons sont enregistrés à l'avance par [Piper](https://github.com/OHF-Voice/piper1-gpl), une synthèse vocale qui
tourne sur l'ordinateur (`npm run voix`).

- **Dictée** : voix `fr_FR-siwis-medium`, entraînée sur le
  [SIWIS French Speech Synthesis Database](https://datashare.ed.ac.uk/handle/10283/2353) (CC BY 4.0), à partir du
  modèle anglais `hifi_tts_92` (voix de Cori Samuel,
  [Hi-Fi Multi-Speaker English TTS Dataset](https://www.openslr.org/109/), NVIDIA, CC BY 4.0).
- **Anglais** : voix `en_GB-aru-medium` (lecteur 3), entraînée sur le
  [ARU Speech Corpus](https://www.liverpool.ac.uk/architecture/research/acoustics-research-unit/speech-corpus/)
  de l'université de Liverpool (CC BY 4.0),
  à partir du même modèle `hifi_tts_92` (CC BY 4.0).
