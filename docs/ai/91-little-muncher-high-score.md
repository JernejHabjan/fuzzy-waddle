# Issue #91 - Little Muncher High Score

## Summary
Implement per-hill high score system for Little Muncher game with database storage and display components.

---

## Database

### Create SQL Migration File
- [ ] Create `DBMs/0006_little_muncher_scores.sql`

```sql
-- Table
CREATE TABLE little_muncher_scores (
  id        SERIAL PRIMARY KEY,
  score     INT NOT NULL,
  hill      INT NOT NULL,  -- LittleMuncherHillEnum (1-7)
  user_id   uuid NOT NULL,
  date      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX idx_little_muncher_scores_user_id ON little_muncher_scores(user_id);
CREATE INDEX idx_little_muncher_scores_hill ON little_muncher_scores(hill);
CREATE INDEX idx_little_muncher_scores_score ON little_muncher_scores(score);

-- RLS Policies
ALTER TABLE little_muncher_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all users"
  ON little_muncher_scores FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users"
  ON little_muncher_scores FOR INSERT TO authenticated WITH CHECK (true);

-- View (top 3 unique users per hill)
CREATE VIEW little_muncher_scores_with_user_meta AS
WITH ranked_scores AS (
  SELECT
    s.id, s.score, s.hill, s.user_id, s.date, p.name,
    ROW_NUMBER() OVER (PARTITION BY s.hill, s.user_id ORDER BY s.score DESC) as user_rn
  FROM little_muncher_scores s
  JOIN profiles p ON s.user_id = p.id
),
unique_user_scores AS (
  SELECT * FROM ranked_scores WHERE user_rn = 1
),
hill_ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY hill ORDER BY score DESC) as hill_rn
  FROM unique_user_scores
)
SELECT id, score, hill, user_id, date, name FROM hill_ranked WHERE hill_rn <= 3;
```

- [ ] Run migration in Supabase

---

## API Interfaces (libs/api-interfaces)

### Create Score DTO
- [ ] Create `libs/api-interfaces/src/lib/little-muncher/little-muncher-score.dto.ts`

```typescript
import { LittleMuncherHillEnum } from './little-muncher';

export class LittleMuncherScoreDto {
  constructor(
    public score: number,
    public hill: LittleMuncherHillEnum,
    public userName: string,
    public userId: string,
    public date?: Date
  ) {}
}
```

- [ ] Export from `libs/api-interfaces/src/lib/little-muncher/index.ts`
- [ ] Export from `libs/api-interfaces/src/index.ts`

---

## Backend (apps/api)

### High Score Service
- [ ] Create `apps/api/src/app/little-muncher/high-score/little-muncher-high-score.service.ts`

```typescript
@Injectable()
export class LittleMuncherHighScoreService {
  constructor(private readonly supabaseProviderService: SupabaseProviderService) {}

  async postScore(body: LittleMuncherScoreDto, user: User): Promise<void> {
    // Insert into little_muncher_scores table
  }

  async getScores(): Promise<LittleMuncherScoreDto[]> {
    // Query little_muncher_scores_with_user_meta view
  }
}
```

### Controller Endpoints
- [ ] Add to `apps/api/src/app/little-muncher/game-instance/game-instance.controller.ts`:
  - `POST /api/little-muncher/post-score` (with SupabaseAuthGuard)
  - `GET /api/little-muncher/get-scores`

### Module Registration
- [ ] Add `LittleMuncherHighScoreService` to `apps/api/src/app/little-muncher/little-muncher.module.ts`

---

## Client - Service Layer (apps/client)

### High Score Service
- [ ] Create `apps/client/src/app/little-muncher/high-score/high-score.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class LittleMuncherHighScoreService {
  async postScore(score: number, hill: LittleMuncherHillEnum): Promise<void> {
    // POST to /api/little-muncher/post-score
  }

  async getScores(): Promise<LittleMuncherScoreDto[]> {
    // GET from /api/little-muncher/get-scores
  }
}
```

### Scene Communicator Integration
- [ ] Create `apps/client/src/app/little-muncher/main/scene-communicator-client.service.ts`
  - Subscribe to game-over/victory events
  - Call `highScoreService.postScore()` on game end

---

## Client - UI Components (apps/client)

### High Score Component
- [ ] Create `apps/client/src/app/little-muncher/high-score/high-score.component.ts`
- [ ] Create `apps/client/src/app/little-muncher/high-score/high-score.component.html`

Features:
- Display top 3 scores per hill
- Group by hill name
- Show user name, score, date
- Loading state handling

### Integration Points
- [ ] Add route to `apps/client/src/app/little-muncher/little-muncher.routes.ts`
- [ ] Add navigation link from Little Muncher menu

---

## Game Integration

### Score Submission Trigger
- [ ] Modify `apps/client/src/app/little-muncher/game/little-muncher-scene.ts`
  - On victory (reached hill top): emit final score event
  - On death: emit final score event

### Event Flow
```
Game Over (victory/death)
  → little-muncher-scene.ts emits final score
  → scene-communicator-client.service.ts receives event
  → Calls highScoreService.postScore(score, hill)
  → HTTP POST to /api/little-muncher/post-score
  → Server inserts to little_muncher_scores table
```

---

## File Structure

```
DBMs/
  └── 0006_little_muncher_scores.sql          # NEW

libs/api-interfaces/src/lib/little-muncher/
  ├── little-muncher-score.dto.ts             # NEW
  └── index.ts                                # MODIFY

apps/api/src/app/little-muncher/
  ├── high-score/
  │   └── little-muncher-high-score.service.ts  # NEW
  ├── game-instance/
  │   └── game-instance.controller.ts         # MODIFY
  └── little-muncher.module.ts                # MODIFY

apps/client/src/app/little-muncher/
  ├── high-score/
  │   ├── high-score.service.ts               # NEW
  │   ├── high-score.component.ts             # NEW
  │   └── high-score.component.html           # NEW
  ├── main/
  │   └── scene-communicator-client.service.ts  # NEW
  ├── game/
  │   └── little-muncher-scene.ts             # MODIFY
  └── little-muncher.routes.ts                # MODIFY
```

---

## Reference Files

| Purpose | File Path |
|---------|-----------|
| DB Template | `DBMs/0004_fly-squasher_scores.sql` |
| DTO Example | `libs/api-interfaces/src/lib/fly-squasher/score.dto.ts` |
| Server Service | `apps/api/src/app/fly-squasher/fly-squasher.service.ts` |
| Server Controller | `apps/api/src/app/fly-squasher/fly-squasher.controller.ts` |
| Client Service | `apps/client/src/app/fly-squasher/high-score/high-score.service.ts` |
| Client Component | `apps/client/src/app/fly-squasher/high-score/high-score.component.ts` |
| Scene Communicator | `apps/client/src/app/fly-squasher/main/scene-communicator-client.service.ts` |
| Hills Enum | `libs/api-interfaces/src/lib/little-muncher/little-muncher.ts` |
| Game Scene | `apps/client/src/app/little-muncher/game/little-muncher-scene.ts` |

---

## Notes

- Score is submitted from client-side (server doesn't run game logic)
- Server validates user via SupabaseAuthGuard before inserting score
- Top 3 unique users per hill (highest score per user counts)
- Hills: Stefka, Jakob, Triglav, Razor, Tosc, Prisojnik, Sneznik (enum 1-7)
