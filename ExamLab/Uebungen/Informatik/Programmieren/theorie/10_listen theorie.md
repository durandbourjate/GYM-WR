# Listen (Kurzüberblick)

Listen speichern mehrere Werte in einer geordneten Sammlung:

```python
# Liste erstellen
inventar = ["Taschenlampe", "Kompass", "Trinkflasche"]

# Element hinzufügen
inventar.append("Taschenmesser")

# Auf Element zugreifen (Index beginnt bei 0)
print(inventar[0])    # Taschenlampe
print(inventar[-1])   # Taschenmesser (letztes Element)

# Länge der Liste
print(len(inventar))  # 4

# Prüfen, ob Element vorhanden
if "Kompass" in inventar:
    print("Du hast einen Kompass!")

# Mit for-Schleife durchgehen
for gegenstand in inventar:
    print(f"- {gegenstand}")
```

Listen sind besonders nützlich, um z.B. das Inventar des Spielers oder eine Liste von besuchten Räumen zu verwalten.
