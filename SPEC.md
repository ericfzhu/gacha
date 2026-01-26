# Kantai Collection Clone - Game Design Specification

## Overview

A browser-based naval fleet management and combat game designed as a **single-session Special gift experience**. The player collects and battles with anthropomorphized warships (ship girls) to earn Premium Tickets, which can be used in a special gacha where the 3 Grand Prizes represent **real-life Special gift choices**.

**Target Experience:**
- Completable in one sitting (~30 minutes)
- No timers, waits, or daily mechanics
- Clear progression toward earning gift selection
- Fun and accessible for gacha/game newcomers
- Simplified resources (Fuel + Premium Tickets only)
- 4 battle maps with increasing difficulty

---

## Table of Contents

1. [Visual Design Style](#1-visual-design-style)
2. [Core Systems](#2-core-systems)
3. [Ship Girl System](#3-ship-girl-system)
4. [Equipment System](#4-equipment-system)
5. [Fleet Management](#5-fleet-management)
6. [Combat System](#6-combat-system)
7. [Resource System](#7-resource-system)
8. [Construction & Development](#8-construction--development)
9. [Repair & Maintenance](#9-repair--maintenance)
10. ~~Expedition System~~ (Removed)
11. [Quest System / Map Progression](#11-quest-system)
12. ~~PvP System~~ (Removed)
13. ~~Event System~~ (Removed)
14. [Secret Code System](#14-secret-code-system)
15. [Special Gift Reveal](#15-special-gift-reveal)
16. [UI/UX Design](#16-uiux-design)
17. [Technical Architecture](#17-technical-architecture)
18. [Monetization](#18-monetization)
19. [Development Phases](#19-development-phases)
20. [Asset Requirements](#20-asset-requirements)
21. [Implementation Notes](#21-implementation-notes)

---

## 1. Visual Design Style

### 1.1 Art Direction

**Overall Aesthetic:** Modern naval command interface - clean, functional, military dashboard with anime character art as the focal point. Inspired by Kantai Collection's actual UI.

**Character Art Style:**
- Anime-style illustration (ship girls/kanmusu)
- Characters depicted as young women personifying warships
- Military uniforms/outfits incorporating ship elements (turrets, rigging, anchors)
- Large character portraits prominently displayed
- Each ship class has distinct visual themes

**Background Style:**
- Naval base/port backgrounds with water, docks, sky
- Ocean backgrounds for combat
- Clean, semi-transparent UI panels overlaying backgrounds
- Subtle animated elements (waves, clouds)

### 1.2 Color Palette (KanColle-Accurate)

**Primary Colors:**
| Color | Hex | Usage |
|-------|-----|-------|
| Ocean Blue | #1e3a5f | Headers, primary panels |
| Sky Blue | #87ceeb | Backgrounds, accents |
| Steel Blue | #4a6fa5 | Secondary panels, borders |
| White | #ffffff | Panel backgrounds, text |
| Light Gray | #e8eef4 | Subtle backgrounds |

**Resource Colors (Simplified):**
| Resource | Color | Hex |
|----------|-------|-----|
| Fuel | Green | #4caf50 |
| Premium Tickets | Gold | #ffc107 |

**UI Colors:**
| Element | Hex | Usage |
|---------|-----|-------|
| Panel BG | #f5f5f5 | Main content areas |
| Panel Border | #c5d5e5 | Panel outlines |
| Text Dark | #1a1a2e | Primary text |
| Text Muted | #6b7b8b | Secondary text |
| Success | #4caf50 | Positive states |
| Warning | #ff9800 | Caution states |
| Danger | #f44336 | Negative states, damage |
| Highlight | #2196f3 | Selected items, links |

**Rarity Colors:**
| Rarity | Color | Hex |
|--------|-------|-----|
| Common (N) | Gray | #9e9e9e |
| Rare (R) | Blue | #2196f3 |
| Super Rare (SR) | Purple | #9c27b0 |
| Ultra Rare (SSR) | Gold | #ffc107 |

### 1.3 UI Design Language

**Framework:** Clean, modern dashboard UI with translucent panels

**Key Elements:**
- Semi-transparent white/light panels over scenic backgrounds
- Clean rectangular shapes with subtle rounded corners (4px)
- Light borders (1-2px) in blue-gray tones
- Minimal drop shadows for subtle depth
- Clear visual hierarchy with proper spacing

**Typography:**
| Element | Font | Size | Color |
|---------|------|------|-------|
| Headers | Sans-serif bold | 18-24px | #1a1a2e |
| Body | Sans-serif | 14-16px | #1a1a2e |
| Labels | Sans-serif | 12px | #6b7b8b |
| Numbers | Sans-serif medium | 14-16px | #1a1a2e |

**Button Styles:**
- Primary: Blue fill (#2196f3), white text, subtle hover darkening
- Secondary: White/light fill, blue text, blue border on hover
- Menu buttons: Rectangular, icon + text, subtle background on hover
- Disabled: Grayed out with reduced opacity

**Panel Styles:**
- Main panels: White/light gray background, rgba(255,255,255,0.9)
- Subtle blue-gray border: 1px solid #c5d5e5
- Slight border-radius: 4-8px
- Optional subtle shadow for elevation

### 1.4 Screen Layouts (KanColle-Style)

**Home Port Screen:**
```
┌─────────────────────────────────────────────────────┐
│ [HQ Lv] [Name]          [Fuel][Ammo][Steel][Baux]  │ <- Top resource bar
├─────────────────────────────────────────────────────┤
│                                                     │
│    ┌─────────────────┐    ┌──────────────────────┐ │
│    │                 │    │      Menu Panel      │ │
│    │   Secretary     │    │  ┌────────────────┐  │ │
│    │   Ship Art      │    │  │    Sortie      │  │ │
│    │   (Large)       │    │  ├────────────────┤  │ │
│    │                 │    │  │    Organize    │  │ │
│    │                 │    │  ├────────────────┤  │ │
│    │                 │    │  │    Supply      │  │ │
│    │                 │    │  ├────────────────┤  │ │
│    │                 │    │  │    Dock        │  │ │
│    │                 │    │  ├────────────────┤  │ │
│    └─────────────────┘    │  │    Arsenal     │  │ │
│                           └──────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ [Fleet Status] [Ship Count]           [Time/Date]  │ <- Bottom info bar
└─────────────────────────────────────────────────────┘
Background: Naval base/port scene with water, sky
```

**Battle Screen:**
```
┌─────────────────────────────────────────────────────┐
│ [Map Name]              [Battle Phase] [Formation] │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Allied Fleet          │         Enemy Fleet       │
│  ┌─────────────────┐   │   ┌─────────────────┐    │
│  │ [Ship] HP ████  │   │   │ HP ████ [Enemy] │    │
│  │ [Ship] HP ███   │   │   │ HP ███  [Enemy] │    │
│  │ [Ship] HP ████  │   │   │ HP ████ [Enemy] │    │
│  │ [Ship] HP ██    │   │   │ HP ██   [Enemy] │    │
│  └─────────────────┘   │   └─────────────────┘    │
│                                                     │
│              [Combat Animation Area]                │
│                                                     │
├─────────────────────────────────────────────────────┤
│ [Battle Log]                    [Retreat][Advance] │
└─────────────────────────────────────────────────────┘
Background: Ocean with waves, sky
```

### 1.5 Animation Style

**Transitions:**
- Smooth, quick transitions (150-250ms)
- Fade for scene changes
- Slide for panels
- Subtle scale on button hover (1.02x)

**Combat Animations:**
- Character sprites with attack animations
- Projectile effects (shells, torpedoes)
- Splash effects on water
- Damage numbers rising and fading
- HP bar smooth decrease
- Screen shake on critical hits (subtle)

### 1.6 Responsive Design

**Target Resolution:** 1200x720 (16:9) with FIT scaling
**Mobile Support:** Scaled down with FIT mode, touch-friendly buttons

---

## 2. Core Systems

### 2.1 Game Loop (Simplified for Single Session)

```
Tutorial → Unlock Ships → Battle Maps → Earn Tickets → Pull Gacha → Choose Gift
```

**Session Flow:**
1. **Tutorial (5 min)**: Learn basic mechanics, receive starter ships + 5 tickets
2. **Early Maps (20-30 min)**: Easy battles, earn tickets, unlock new ships
3. **Mid Maps (30-40 min)**: Moderate difficulty, more tickets
4. **Late Maps (30-40 min)**: Challenging battles, bonus ticket rewards
5. **Gacha Phase**: Use accumulated tickets to pull for Special gifts
6. **Secret Code**: Optional code entry for 50 bonus tickets
7. **Gift Selection**: Exchange tokens for chosen gift OR get lucky from pulls

### 2.2 Core Pillars

- **Collection**: Acquire ship girls through map drops and standard construction
- **Combat**: Tactical battles with formation choices
- **Gacha**: Fun pulling experience leading to real gift selection
- **Reward**: The 3 Grand Prizes are actual Special gift choices

### 2.3 Removed Systems (Simplified for Single Session)

The following traditional gacha game systems are **NOT included**:
- ~~Real-time timers~~ (construction/repair is instant)
- ~~Daily/Weekly/Monthly quests~~
- ~~Expeditions~~
- ~~Morale system~~
- ~~PvP/Rankings~~
- ~~Events~~ (the whole game IS the event)
- ~~Premium currency~~

---

## 3. Ship Girl System

### 2.1 Ship Types

| Type | Abbreviation | Role |
|------|--------------|------|
| Destroyer | DD | Anti-submarine, torpedo attacks, expedition |
| Light Cruiser | CL | Fleet support, anti-submarine |
| Heavy Cruiser | CA | Balanced combat |
| Aviation Cruiser | CAV | Seaplane operations |
| Battleship | BB | Heavy shelling |
| Fast Battleship | FBB | Mobile heavy firepower |
| Aviation Battleship | BBV | Shelling + seaplane |
| Light Carrier | CVL | Light air support |
| Standard Carrier | CV | Main air power |
| Armored Carrier | CVB | Durable air power |
| Submarine | SS | Stealth attacks |
| Submarine Carrier | SSV | Submarine + seaplane |
| Seaplane Tender | AV | Seaplane deployment |
| Repair Ship | AR | Fleet repairs |
| Training Cruiser | CT | Experience bonus |
| Amphibious Assault Ship | LHA | Landing operations |

### 2.2 Ship Statistics

**Primary Stats:**
- `HP` - Hit Points (health)
- `Firepower` - Shelling damage
- `Torpedo` - Torpedo attack power
- `Anti-Air (AA)` - Air defense capability
- `Armor` - Damage reduction
- `Evasion` - Chance to dodge attacks
- `Aircraft` - Plane carrying capacity (slots)
- `Speed` - Fast/Slow (affects routing)
- `Range` - Short/Medium/Long/Very Long (attack order)
- `Luck` - Critical hit and cut-in chance
- `LOS (Line of Sight)` - Reconnaissance ability

**Secondary Stats:**
- `ASW` - Anti-submarine warfare
- `Accuracy` - Hit chance modifier

### 2.3 Ship Rarity

| Rarity | Color | Drop Rate Modifier |
|--------|-------|-------------------|
| Common | Gray | 1.0x |
| Uncommon | Blue | 0.5x |
| Rare | Purple | 0.2x |
| Super Rare | Gold | 0.05x |
| Ultra Rare | Rainbow | 0.01x |

### 2.4 Leveling & Experience

- Ships gain EXP from combat (MVP bonus 2x)
- Level cap: 99 (175 after marriage)
- EXP curve: `required_exp = level^3 * 1.2`
- Flagship bonus: 1.5x EXP

### 2.5 Modernization

Feed ships to boost base stats:
- Each fodder ship provides stats based on their type
- Stats capped at ship's maximum modernization values
- Consumed ships are permanently lost

### 2.6 Remodeling (Kai/Kai Ni)

Ships can be upgraded at certain levels:
- **Kai (First Remodel)**: Level 20-50 typically
- **Kai Ni (Second Remodel)**: Level 70-90 typically
- Requires resources and sometimes blueprints
- Provides stat boosts, new art, new abilities, additional equipment slots

### 3.7 Morale System

**SIMPLIFIED**: Morale is not tracked in this version. Ships are always ready for battle.

---

## 4. Equipment System

### 3.1 Equipment Categories

**Weapons:**
- Small Caliber Main Guns (DD, CL)
- Medium Caliber Main Guns (CA, CL)
- Large Caliber Main Guns (BB)
- Secondary Guns
- Torpedoes
- Anti-Submarine Mortars/Depth Charges

**Aircraft:**
- Fighters (Air superiority)
- Dive Bombers (Shelling support)
- Torpedo Bombers (Aerial torpedoes)
- Reconnaissance Planes
- Seaplanes

**Support:**
- Radar (Air/Surface)
- Engine Improvements
- Anti-Air Fire Directors
- Bulges (Armor)
- Damage Control

### 3.2 Equipment Stats

- `Firepower` - Damage bonus
- `Torpedo` - Torpedo damage bonus
- `Bombing` - Dive bomb damage
- `AA` - Anti-air stat
- `ASW` - Anti-submarine stat
- `Accuracy` - Hit rate bonus
- `Evasion` - Dodge bonus
- `LOS` - Line of sight bonus
- `Armor` - Damage reduction
- `Range` - Attack range modifier

### 3.3 Equipment Slots

Ships have 1-5 equipment slots depending on type/remodel:
- Each slot may have aircraft capacity (for carriers/seaplane ships)
- Slot restrictions based on ship type
- Reinforcement expansion slot (optional unlock)

### 3.4 Equipment Improvement (Akashi System)

- Improve equipment using resources + fodder equipment
- Stars: +0 to +10
- Each star provides small stat bonuses
- Some equipment can be upgraded to different equipment at max stars

---

## 5. Fleet Management

### 4.1 Fleet Structure

- 4 fleets available (unlock progressively)
- 6 ships per fleet maximum
- Fleet 1: Primary sortie fleet
- Fleets 2-4: Expeditions or support

### 4.2 Combined Fleet

For events/special maps:
- **Carrier Task Force**: CV/CVL heavy + escort fleet
- **Surface Task Force**: BB/CA heavy + escort fleet
- **Transport Escort**: Transport focused

### 4.3 Fleet Presets

- Save/load fleet compositions
- Store equipment loadouts
- Quick swap functionality

### 4.4 Supply System

Ships consume fuel and ammo:
- Resupply required after sorties
- Partial supply affects combat performance
- Aircraft resupply for carriers

---

## 6. Combat System

### 5.1 Sortie Flow

```
Map Selection → Fleet Selection → Route Determination →
Node Combat → Continue/Retreat Decision → Boss Node → Results
```

### 5.2 Map Structure

- Multiple worlds with chapters
- Each chapter has multiple maps
- Maps contain nodes connected by routes
- Node types: Battle, Resource, Boss, Empty, Maelstrom

### 5.3 Routing

Based on:
- Fleet composition
- Ship types present
- LOS values
- Random chance (some nodes)

### 5.4 Battle Phases

**Day Battle:**
1. **Detection Phase** - LOS check
2. **Air Battle** - Fighter combat, bombing runs
3. **Opening ASW** - Anti-submarine attack (if equipped)
4. **Opening Torpedo** - High-level ships torpedo salvo
5. **Shelling Phase 1** - All ships attack by range
6. **Shelling Phase 2** - BB/CV attack again (if present)
7. **Closing Torpedo** - All torpedo-capable ships

**Night Battle (Optional):**
- Single shelling phase
- Special cut-in attacks possible
- Higher damage potential

### 5.5 Formations

| Formation | Shelling | Torpedo | ASW | AA | Evasion |
|-----------|----------|---------|-----|-----|---------|
| Line Ahead | 100% | 100% | 60% | 100% | 100% |
| Double Line | 80% | 80% | 80% | 120% | 100% |
| Diamond | 70% | 40% | 110% | 150% | 100% |
| Echelon | 75% | 60% | 110% | 100% | 130% |
| Line Abreast | 60% | 60% | 130% | 100% | 150% |

### 5.6 Damage States

| State | HP Remaining | Effect |
|-------|--------------|--------|
| Minor Damage | 75-100% | None |
| Moderate Damage | 50-75% | Visual indicator |
| Heavy Damage | 25-50% | Different art, penalties |
| Critical | <25% | Cannot sortie, sinking risk |
| Sunk | 0% | Ship lost permanently |

### 5.7 Air State

Determined by fighter power comparison:
- **Air Supremacy**: 3x enemy fighter power
- **Air Superiority**: 1.5x enemy fighter power
- **Air Parity**: Between 2/3x and 1.5x
- **Air Denial**: Between 1/3x and 2/3x
- **Air Incapability**: Less than 1/3x

### 5.8 Battle Results

| Rank | Condition |
|------|-----------|
| S | Perfect victory, all enemies sunk |
| A | All enemies sunk OR flagship sunk |
| B | Flagship sunk OR >50% enemies sunk |
| C | Moderate damage dealt |
| D | Minimal damage dealt |
| E | Defeat |

### 5.9 Special Attacks (Cut-ins)

**Day Battle:**
- Artillery Spotting (requires seaplane + air superiority)
- Double Attack
- Main Gun Cut-in

**Night Battle:**
- Torpedo Cut-in (high torpedo + luck)
- Mixed Cut-in (gun + torpedo)
- Double Attack

---

## 7. Resource System

### 6.1 Primary Resources

| Resource | Icon | Usage |
|----------|------|-------|
| Fuel | Green | Sortie, repair, construction |
| Ammo | Bronze | Sortie, construction |
| Steel | Gray | Repair, construction |
| Bauxite | Orange | Aircraft, construction |

### 6.2 Special Resources

- **Instant Repair (Buckets)**: Skip repair time
- **Instant Construction**: Skip build time
- **Development Materials**: Equipment crafting
- **Improvement Materials**: Equipment upgrades
- **Blueprints**: Required for certain remodels

### 6.3 Resource Regeneration

- Natural regen: 3 per 3 minutes (each resource)
- Soft cap: Based on HQ level (300 + HQ_Level * 50)
- Hard cap: 350,000

### 6.4 Resource Acquisition

- Natural regeneration
- Expeditions
- Quest rewards
- Map node drops
- Event rewards

---

## 8. Construction & Development

### 7.1 Ship Construction

**Standard Construction:**
- Input: Fuel, Ammo, Steel, Bauxite
- Recipe determines ship pool
- Construction time indicates ship type/rarity
- Uses 1 empty construction dock

**Premium Gacha (Limited Banner):**

A secondary gacha system with exclusive rewards, designed for accessibility without premium currency.

**Cost:**
- 1 Premium Ticket per pull
- 10 Premium Tickets for 10-pull (no discount, just convenience)

**How to Earn Premium Tickets:**

| Source | Amount | Notes |
|--------|--------|-------|
| Tutorial completion | 5 tickets | Starting bonus |
| Map clear (per map) | 8-12 tickets | ~10 maps total |
| Boss S-Rank bonus | +2 tickets | Per map, skill reward |
| Secret Code entry | 50 tickets | Special code input screen |

**Ticket Economy:**
- **Gameplay total:** ~100 tickets (completing all maps with good ranks)
- **Secret code:** 50 tickets
- **Maximum possible:** 150 tickets

*This guarantees the player can exchange for ANY Grand Prize (max cost 150 tokens), ensuring they can always choose their preferred Special gift.*

**Reward Structure:**

| Tier | Drop Rate | Rewards |
|------|-----------|---------|
| **Grand Prize 1** | 2.0% | [TBD - Special Gift Choice #1] |
| **Grand Prize 2** | 0.5% | [TBD - Special Gift Choice #2] |
| **Grand Prize 3** | 0.2% | [TBD - Special Gift Choice #3] |
| **Consolation A** | 12.3% | Super Rare Ship (in-game reward) |
| **Consolation B** | 25% | Rare Equipment (in-game reward) |
| **Consolation C** | 30% | Resources (in-game reward) |
| **Consolation D** | 30% | Resources (in-game reward) |

*Note: Grand Prizes represent REAL Special gift choices. When obtained, a special screen reveals the gift with a personalized message.*

**Grand Prize Limit:**
- Each Grand Prize can only be obtained **once** (via pull OR exchange)
- Once obtained, that Grand Prize is removed from the pull pool
- Drop rates redistribute to remaining prizes and consolations:

| Scenario | GP1 (2%) | GP2 (0.5%) | GP3 (0.2%) | Consolation A |
|----------|----------|------------|------------|---------------|
| All available | 2.0% | 0.5% | 0.2% | 12.3% |
| GP1 obtained | -- | 0.5% | 0.2% | 14.3% |
| GP1 + GP2 obtained | -- | -- | 0.2% | 14.8% |
| All GP obtained | -- | -- | -- | 15.0% |

*When all Grand Prizes are collected, banner converts to consolation-only rewards*

**Pity System (Exchange Shop):**

Each pull awards **Pity Tokens** that can be exchanged directly for Grand Prizes:

| Pull Result | Tokens Earned |
|-------------|---------------|
| Any pull | +1 Token |
| Consolation A-B | +2 Tokens |
| Grand Prize | +5 Tokens |

**Exchange Costs:**

| Reward | Token Cost |
|--------|------------|
| Grand Prize 1 (2.0%) | 50 Tokens |
| Grand Prize 2 (0.5%) | 100 Tokens |
| Grand Prize 3 (0.2%) | 150 Tokens |

*This guarantees the rarest reward within 150 pulls maximum if unlucky*

**Banner Types:**
- **Limited Event Banner**: Time-limited, exclusive units
- **Rotating Banner**: Different featured rewards each month

**Pull History:**
- View last 100 pulls
- Track pity token balance
- Statistics display (total pulls, grand prizes obtained)

### 7.2 Construction Times

| Time | Typical Result |
|------|----------------|
| 20 min | Common DD |
| 30 min | DD/CL |
| 1 hour | CL/CA |
| 2 hours | CA/BB |
| 4+ hours | BB/CV |

### 7.3 Equipment Development

- Input: Fuel, Ammo, Steel, Bauxite (10-999 each)
- Secretary ship affects result pool
- Recipe determines equipment pool
- Development materials consumed on failure

---

## 9. Repair & Maintenance

**SIMPLIFIED FOR SINGLE SESSION**

### 9.1 Instant Repairs

- All repairs are **instant** (no waiting)
- Ships fully heal between maps
- No repair docks or buckets needed
- Damaged ships can still sortie (but with penalties)

### 9.2 Repair Costs

- Small resource cost (fuel + steel) per repair
- Or: Free auto-repair between maps

---

## 10. Expedition System

**REMOVED** - Not applicable for single-session gameplay.

---

## 11. Quest System

**REMOVED** - Replaced with simple map progression.

### 11.1 Map Progression (Replaces Quests)

Instead of daily/weekly quests, progression is tied to maps:

| Map | Clear Reward | S-Rank Bonus |
|-----|--------------|--------------|
| 1-1 | 8 tickets + unlock 1-2 | +2 tickets |
| 1-2 | 8 tickets + unlock 1-3 | +2 tickets |
| 1-3 | 10 tickets + unlock 2-1 | +2 tickets |
| ... | ... | ... |
| 3-4 (Final) | 15 tickets + ending | +2 tickets |

*Total: ~100 tickets from full completion*

---

## 12. PvP System

**REMOVED** - Not applicable for single-session gameplay.

---

## 13. Event System

**REMOVED** - The entire game IS the Special event.

---

## 14. Secret Code System

### 14.1 Code Entry

A special screen accessible from the main menu where the player can enter a secret code.

**Functionality:**
- Text input field for code entry
- "Redeem" button to submit
- Success/failure feedback

**Reward:**
- Correct code: **50 Premium Tickets** (one-time only)
- Incorrect code: Gentle "Try again" message

### 14.2 Code Configuration

The code should be configurable (set by you before giving her the game):
- Stored in config file or environment variable
- Could be something meaningful (anniversary date, pet name, inside joke, etc.)
- Case-insensitive matching recommended

### 14.3 UI Placement

- Accessible from Settings menu or a subtle "?" icon
- Not immediately obvious (adds discovery element)
- Or: Unlocks after completing first few maps

---

## 15. Special Gift Reveal

### 15.1 Grand Prize Reveal Screen

When a Grand Prize is obtained (via pull or exchange), display a special reveal:

**Animation Sequence:**
1. Screen dims, sparkle effects
2. Gift box appears (themed to Special)
3. Box opens with flourish
4. Gift image/description revealed
5. Personalized message displays
6. "This is your Special gift!" confirmation

### 15.2 Gift Display

Each Grand Prize should show:
- Gift name/title
- Image or icon representing the gift
- Short romantic/personalized description
- "Claimed" status (visible in collection)

### 15.3 Gift Collection Screen

A dedicated screen showing:
- All 3 possible gifts (silhouettes for unobtained)
- Obtained gifts fully revealed
- Progress toward each via token exchange

---

## 16. UI/UX Design

### 16.1 Main Screens

1. **Home/Port Screen**
   - Secretary ship display
   - Resource display
   - Quick access buttons
   - Notification area

2. **Sortie Screen**
   - World/Map selection
   - Fleet status
   - Battle interface

3. **Dock Screen**
   - Repair docks
   - Construction docks

4. **Arsenal Screen**
   - Ship construction
   - Equipment development
   - Equipment improvement

5. **Fleet Screen**
   - Fleet organization
   - Equipment management
   - Ship list

6. **Quest Screen**
   - Active quests
   - Quest progress
   - Rewards

### 13.2 Ship List Features

- Sort by: Level, Type, Rarity, Stats, Lock status
- Filter by: Type, Rarity, Remodel status
- Search by name

### 13.3 Equipment List Features

- Sort by: Type, Stats, Improvement level
- Filter by: Category, Equipped status
- Equip/Unequip interface

### 13.4 Notification System

- Expedition complete
- Repair complete
- Construction complete
- Quest complete
- Morale recovered

---

## 17. Technical Architecture

### 14.1 Technology Stack

**Frontend:**
- React/Vue.js for SPA
- Canvas/WebGL for combat animations
- WebSocket for real-time updates

**Backend:**
- Node.js/Python/Go API server
- PostgreSQL for game data
- Redis for caching/sessions

**Infrastructure:**
- Docker containers
- Load balancer
- CDN for assets

### 14.2 Data Models

**User:**
```json
{
  "id": "uuid",
  "username": "string",
  "hq_level": "int",
  "experience": "int",
  "resources": {
    "fuel": "int",
    "ammo": "int",
    "steel": "int",
    "bauxite": "int",
    "buckets": "int",
    "devmats": "int"
  },
  "ship_slots": "int",
  "equipment_slots": "int"
}
```

**Ship Instance:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "ship_id": "int (base ship reference)",
  "level": "int",
  "experience": "int",
  "hp_current": "int",
  "morale": "int",
  "fuel": "int",
  "ammo": "int",
  "modernization": {
    "firepower": "int",
    "torpedo": "int",
    "aa": "int",
    "armor": "int"
  },
  "equipment_slots": ["equipment_instance_id", ...],
  "locked": "boolean",
  "married": "boolean"
}
```

**Ship Base:**
```json
{
  "id": "int",
  "name": "string",
  "ship_type": "string",
  "rarity": "int",
  "base_stats": {...},
  "max_stats": {...},
  "remodel_level": "int",
  "remodel_to": "int",
  "equipment_slots": "int",
  "aircraft_capacity": [...]
}
```

**Equipment Instance:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "equipment_id": "int",
  "improvement_level": "int",
  "equipped_to": "ship_instance_id or null"
}
```

### 14.3 API Endpoints (Sample)

```
POST   /api/auth/login
POST   /api/auth/register

GET    /api/ships
GET    /api/ships/:id
POST   /api/ships/modernize
POST   /api/ships/remodel

GET    /api/equipment
POST   /api/equipment/develop
POST   /api/equipment/improve

GET    /api/fleets
PUT    /api/fleets/:id
POST   /api/fleets/:id/supply

POST   /api/sortie/start
POST   /api/sortie/advance
POST   /api/sortie/retreat

GET    /api/expeditions
POST   /api/expeditions/start
POST   /api/expeditions/complete

GET    /api/quests
POST   /api/quests/:id/activate
POST   /api/quests/:id/complete

POST   /api/construction/start
POST   /api/construction/complete
POST   /api/repair/start
POST   /api/repair/complete
```

### 14.4 Security Considerations

- Server-authoritative game logic
- Rate limiting on all endpoints
- Anti-cheat validation
- Encrypted client-server communication
- Regular security audits

---

## 18. Monetization

**NOT APPLICABLE** - This is a personal gift, not a commercial product.

---

## 19. Development Phases (Simplified)

### Phase 1: Core Foundation
- [ ] Basic UI framework (home screen, navigation)
- [ ] Ship data models (10-15 ships)
- [ ] Fleet management (1 fleet of 6 ships)
- [ ] Basic combat system (simplified day battle)

### Phase 2: Gameplay Loop
- [ ] Map progression system (~10 maps)
- [ ] Ticket earning from map clears
- [ ] Ship drops from maps
- [ ] Standard construction (instant)

### Phase 3: Premium Gacha
- [ ] Premium ticket system
- [ ] Gacha pull mechanics with rates
- [ ] Pity token accumulation
- [ ] Token exchange shop
- [ ] Grand Prize limit (one each)

### Phase 4: Special Features
- [ ] Secret code entry screen
- [ ] Gift reveal animations
- [ ] Gift collection screen
- [ ] Configure the 3 real gift options
- [ ] Personalized messages

### Phase 5: Polish
- [ ] Tutorial flow
- [ ] Sound effects and music
- [ ] Visual polish and animations
- [ ] Testing and balancing

---

## 20. Asset Requirements

### 17.1 Ship Art (Per Ship)
- Normal portrait
- Damaged portrait
- Card art
- Chibi/SD sprite
- Combat sprites

### 17.2 Equipment Art
- Icon for each equipment type
- Detail view image

### 17.3 UI Assets
- Background screens
- Buttons and icons
- Resource icons
- Status indicators

### 17.4 Audio
- BGM tracks (port, battle, event)
- SFX (attacks, UI)
- Voice lines (optional)

---

## 21. Implementation Notes

This section documents deviations and enhancements from the original specification.

### 21.1 Visual Design

**Notion-Inspired UI (Changed from KanColle Style)**
- Clean white/gray color scheme instead of naval blue
- System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
- Subtle borders and rounded corners (6-8px)
- Light backgrounds: Primary `#ffffff`, Secondary `#f7f6f3`
- Text colors: Primary `#37352f`, Secondary `#787774`, Tertiary `#9b9a97`

**Responsive Design**
- All scenes calculate dimensions from `window.innerWidth` and `window.innerHeight`
- Panels scale proportionally based on screen size
- Fleet scene: 65% fleet panel, 35% ship list
- Secretary panel: 45% width (min 350px, max 550px)

### 21.2 Ship Artwork

**Portrait Images**
- Located in `public/assets/ships/`
- Used for: Secretary display, fleet organization, collection, gacha results
- Naming: `{ship_id}.png` (e.g., `dd_001.png`)

**Banner Images**
- Located in `public/assets/banners/`
- 240x60 horizontal format (KanColle style)
- Used for: Battle/sortie UI ship displays
- Naming: `{ship_id}.png`

### 21.3 Battle System

**Fuel Rewards (5x Base Rate)**
| Node Type | Base | A-Rank | S-Rank |
|-----------|------|--------|--------|
| Boss | 250 | 300 | 375 |
| Regular | 100 | 100 | 150 |

**Persistent Ship Damage**
- Ship HP persists between battles until repaired
- Damage states: Full, Light (<75%), Medium (<50%), Heavy (<25%)
- Heavy damage ships cannot sortie
- Repair dock with timer-based healing

### 21.4 Special Gacha Configuration

**Environment Variables**
Prize names and descriptions are configurable via Cloudflare Pages environment variables:

| Variable | Description |
|----------|-------------|
| `VITE_PRIZE1_NAME` | Name for Grand Prize 1 |
| `VITE_PRIZE1_DESC` | Description for Grand Prize 1 |
| `VITE_PRIZE2_NAME` | Name for Grand Prize 2 |
| `VITE_PRIZE2_DESC` | Description for Grand Prize 2 |
| `VITE_PRIZE3_NAME` | Name for Grand Prize 3 |
| `VITE_PRIZE3_DESC` | Description for Grand Prize 3 |

### 21.5 Map Navigation

**Node-Based Progression**
- Each map has multiple nodes (Start → Combat/Resource → Boss)
- Player manually selects next node at branch points
- Node types: Combat (⚔️), Resource (📦), Boss (👑)
- Retreat option available (except at boss)

### 21.6 Technical Implementation

**Framework**: Phaser 3 with Vite build system
**Hosting**: Cloudflare Pages
**Package Manager**: Yarn 4.x (bundled in `.yarn/releases/`)

**Asset Loading**
- Ship portraits loaded as `ship_portrait_{id}`
- Ship banners loaded as `ship_banner_{id}`
- UI assets generated programmatically in BootScene

---

## Appendix A: Formula Reference

### Damage Calculation
```
base_damage = firepower + equipment_bonuses
damage = base_damage * formation_mod * engagement_mod * critical_mod
final_damage = damage - (armor * random(0.7, 1.0))
```

### Experience Calculation
```
base_exp = map_base_exp * rank_modifier
flagship_exp = base_exp * 1.5
mvp_exp = base_exp * 2.0
```

### Fighter Power
```
fighter_power = sum(plane_aa * sqrt(slot_size) * proficiency_mod)
```

---

## Appendix B: Glossary

- **HQ Level**: Admiral/Commander level, unlocks features
- **Secretary**: Ship displayed on home screen
- **Sparkle**: High morale state (50+)
- **MVP**: Most Valuable Player, ship dealing most damage
- **Cut-in**: Special attack with unique animation
- **Routing**: Path determination through map nodes
- **Premium Gacha**: Secondary gacha system with exclusive rewards and pity system
- **Pity**: Guaranteed reward after certain number of pulls
- **Kai/Kai Ni**: Remodel states (Japanese terms)
