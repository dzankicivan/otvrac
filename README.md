# NBA Igrači - Skup podataka

## Opis
Ovaj skup podataka sadrži informacije o NBA igračima i njihovim timovima. Svaki igrač je povezan s timom u kojem igra, a podaci uključuju informacije o poziciji, visini, težini, broju dresa, te osnovnim osobnim podacima kao što su ime, prezime i nacionalnost.

## Metapodaci

- **Licenca**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Autor**: Ivan Džankić
- **Verzija**: 1.0
- **Jezik**: Engleski

### Atributi
- `first_name`: Ime igrača
- `last_name`: Prezime igrača
- `position`: Pozicija na kojoj igrač igra (npr. Forward, Guard)
- `jersey_number`: Broj dresa igrača
- `height_cm`: Visina igrača u centimetrima
- `weight_kg`: Težina igrača u kilogramima
- `birthdate`: Datum rođenja igrača (format: DDMMYYYY)
- `nationality`: Nacionalnost igrača
- `team_name`: Naziv tima
- `city`: Grad u kojem se tim nalazi
- `team_id`: Unikatni identifikator tima u bazi podataka
- `player_id`: Unikatni identifikator igrača u bazi podataka

### Relacije
- **Timovi (Roditelj)**: Svaki tim može imati više igrača
- **Igrači (Dijete)**: Svaki igrač pripada jednom timu

### Izvoz
- CSV i JSON format pomoću SQL COPY naredbe

### Izvori podataka
Podaci su nabavljeni sa službene NBA stranice

### Kvaliteta podataka
- **Normalizacija**: Podaci su normalizirani u dvije relacije (timovi i igrači) radi lakše analize i preglednosti.
