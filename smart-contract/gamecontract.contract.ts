import { Asset, Contract, TableStore, check, requireAuth, Name, Vector, EMPTY_NAME } from "proton-tsc";
import { currentBlockTime } from "proton-tsc";

const TOKEN_TYPES: string[] = [
  "TOKEN1", "TOKEN2", "TOKEN3", "TOKEN4", "TOKEN5", "TOKEN6", "TOKEN7", "TOKEN8", "TOKEN9", "TOKEN10",
  "TOKEN11", "TOKEN12", "TOKEN13", "TOKEN14", "TOKEN15"
];

@table("balances")
export class Balance {
  constructor(
    public user: Name = EMPTY_NAME,
    public token_type: u8 = 0,
    public balance: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return (this.user.N << 8) + this.token_type;
  }
}

@table("userinfo")
export class UserInfo {
  constructor(
    public user: Name = EMPTY_NAME,
    public last_play: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return this.user.N;
  }
}

@table("leaderboard")
export class LeaderboardEntry {
  constructor(
    public user: Name = EMPTY_NAME,
    public score: u64 = 0,
    public timestamp: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return this.user.N;
  }
}

@contract
export class GameContract extends Contract {
  private balancesTable: TableStore<Balance> = new TableStore<Balance>(this.receiver);
  private userinfoTable: TableStore<UserInfo> = new TableStore<UserInfo>(this.receiver);
  private leaderboardTable: TableStore<LeaderboardEntry> = new TableStore<LeaderboardEntry>(this.receiver);

  @action("startgame")
  startgame(user: Name): void {
    requireAuth(user);
    let info = this.userinfoTable.get(user.N);
    if (!info) {
      info = new UserInfo(user, 0);
    }
    const cooldown: u64 = 14400000000; // 4 hours in microsecs
    check(currentBlockTime() - info.last_play >= cooldown, "Cooldown: Can only play once every 4 hours");
    info.last_play = currentBlockTime();
    this.userinfoTable.set(info, this.receiver);
  }

  @action("claimmulti")
  claimmulti(user: Name, types: Vector<u8>): void {
    requireAuth(user);
    for (let i: i32 = 0; i < types.length; i++) {
      const token_type = types[i];
      check(token_type >= 1 && token_type <= 15, "Invalid token type");
      const key = (user.N << 8) + token_type;
      let balance = this.balancesTable.get(key);
      if (!balance) {
        balance = new Balance(user, token_type, 0);
      }
      balance.balance += 1;
      this.balancesTable.set(balance, this.receiver);
    }
  }

  @action("submitscore")
  submitscore(user: Name, score: u64): void {
    requireAuth(user);
    check(score > 0, "Score must be greater than 0");
    
    let entry = this.leaderboardTable.get(user.N);
    if (!entry) {
      entry = new LeaderboardEntry(user, score, currentBlockTime());
    } else {
      if (score > entry.score) {
        entry.score = score;
        entry.timestamp = currentBlockTime();
      }
    }
    this.leaderboardTable.set(entry, this.receiver);
  }
}
