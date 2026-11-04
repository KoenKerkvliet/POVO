# Na de basisschool: doorstroomschema voor de klas

Een interactief schema met de wegen na de basisschool. Klik op pr.o., vmbo (of een leerweg), havo of vwo en je ziet de scholen in Zuid-Limburg die dat aanbieden. Scholen beheer je zelf in een dashboard.

- `index.html`: het schema voor de kinderen
- `beheer.html`: het dashboard voor jou (inloggen vereist)
- `supabase/schema.sql`: de database (stap 1: scholen en niveaus)
- `supabase/stap2-beroepen.sql`: uitbreiding met beroepen en routes

## Eenmalig instellen

1. **Database aanmaken.** Open Supabase > SQL Editor, plak de inhoud van `supabase/schema.sql` en klik op *Run*.
2. **Jezelf als beheerder aanmaken.** Supabase > Authentication > Users > *Add user* > *Create new user*. Gebruik het e-mailadres dat in `schema.sql` bij `is_beheerder()` staat en vink *Auto Confirm User* aan.
3. **Aanmelden van anderen uitzetten.** Supabase > Authentication > Sign In / Providers > zet *Allow new users to sign up* uit. (Schrijven mag sowieso alleen met jouw e-mailadres, dit is een extra slot.)
4. **Sleutel invullen.** Supabase > Project Settings > API Keys: kopieer de *anon* (of *publishable*) key en plak die in `js/config.js` bij `SUPABASE_ANON_KEY`. Deze sleutel is bedoeld om openbaar te zijn.

**Bijwerken van een bestaande database:** voer `supabase/schema.sql` opnieuw uit. Dat is veilig en verandert geen bestaande gegevens. Het voegt onder andere het tekstveld *Meer informatie* en het vinkje *Tweetalig onderwijs* bij scholen toe, en de tabel voor *Brugklassen*.

Zolang de sleutel leeg is, laat de website voorbeeldscholen en voorbeeldberoepen zien.

## Beroepen en routes (stap 2)

1. Plak `supabase/stap2-beroepen.sql` in de Supabase SQL Editor en klik op *Run*. Er worden twee voorbeelden toegevoegd (kapper en huisarts) die je in het dashboard kunt controleren en aanpassen.
2. In het dashboard, tab *Beroepen*, maak je beroepen aan. Per beroep stel je een of meer routes samen: kies na de basisschool de eerste stap, en daarna steeds de volgende. Je kunt alleen stappen kiezen waar in het schema een pijl naartoe loopt.
3. Op de website verschijnt in de kop een keuzelijst *Beroep*. Kinderen zien dan de routes en in het schema de genummerde stappen. Klikken op een stap toont de uitleg en de scholen.

### Startlijst met beroepen

`supabase/stap3-beroepen-startlijst.sql` zet 37 beroepen met routes klaar: 5 bij het praktijkonderwijs, 3 bij mbo niveau 1, 5 bij niveau 2, 5 bij niveau 3, 5 bij niveau 4, 7 bij het hbo en 7 bij het wo. Voer het uit na `stap2-beroepen.sql`. Een beroep dat al bestaat (op naam) wordt overgeslagen, dus je eigen aanpassingen blijven staan. In de keuzelijst staat elk beroep onder het laagste niveau waarmee je het kunt bereiken.

## Lokaal bekijken

De pagina's gebruiken ES-modules en werken dus niet door ze te dubbelklikken. Start in deze map:

```bash
python -m http.server 5173
```

en open http://localhost:5173.

## Online zetten

Het zijn alleen statische bestanden. Je kunt de map bijvoorbeeld met GitHub Pages, Netlify of Vercel publiceren; er is geen build-stap nodig.

## Lettertypen

De site gebruikt *Atkinson Hyperlegible* en *Bricolage Grotesque*. Beide staan in de map `fonts/` (vrij te gebruiken onder de SIL Open Font License), dus bezoekers maken geen verbinding met Google.

## Wijzigen

- Vorm, kleuren en pijlen van het schema: `js/schema-data.js`
- Standaardteksten per niveau: `js/schema-data.js` (of per niveau overschrijven in het dashboard, tab *Teksten per niveau*)
- Regio-naam: `js/config.js`
