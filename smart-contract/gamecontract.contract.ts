import * as _chain from "as-chain";
import { Asset, Contract, TableStore, check, requireAuth, Name, EMPTY_NAME } from "proton-tsc";
import { currentBlockNum } from "proton-tsc";

const TOKEN_TYPES: string[] = [
  "TOKEN1", "TOKEN2", "TOKEN3", "TOKEN4", "TOKEN5", "TOKEN6", "TOKEN7", "TOKEN8", "TOKEN9", "TOKEN10",
  "TOKEN11", "TOKEN12", "TOKEN13", "TOKEN14", "TOKEN15"
];



export class BalanceDB extends _chain.MultiIndex<Balance> {

}

@table("balances", nocodegen)

export class Balance implements _chain.MultiIndexValue {
    
  constructor(
    public user: Name = EMPTY_NAME,
    public token_type: u8 = 0,
    public balance: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return (this.user.N << 8) + this.token_type;
  }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user);
        enc.packNumber<u8>(this.token_type);
        enc.packNumber<u64>(this.balance);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new Name();
            dec.unpack(obj);
            this.user = obj;
        }
        this.token_type = dec.unpackNumber<u8>();
        this.balance = dec.unpackNumber<u64>();
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user.getSize();
        size += sizeof<u8>();
        size += sizeof<u64>();
        return size;
    }

    static get tableName(): _chain.Name {
        return _chain.Name.fromU64(0x39A269A158000000);
    }

    static tableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        const idxTableBase: u64 = this.tableName.N & 0xfffffffffffffff0;
        const indices: _chain.IDXDB[] = [
        ];
        return indices;
    }

    getTableName(): _chain.Name {
        return Balance.tableName;
    }

    getTableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        return Balance.tableIndexes(code, scope);
    }

    getPrimaryValue(): u64 {
        return this.primary
    }

    getSecondaryValue(i: i32): _chain.SecondaryValue {
        _chain.check(false, "no secondary value!");
        return new _chain.SecondaryValue(_chain.SecondaryType.U64, new Array<u64>(0));
    }
    
    setSecondaryValue(i: i32, value: _chain.SecondaryValue): void {
        _chain.check(false, "no secondary value!");
    }


    static new(code: _chain.Name, scope: _chain.Name  = _chain.EMPTY_NAME): BalanceDB {
        return new BalanceDB(code, scope, this.tableName, this.tableIndexes(code, scope));
    }
}



export class UserInfoDB extends _chain.MultiIndex<UserInfo> {

}

@table("userinfo", nocodegen)

export class UserInfo implements _chain.MultiIndexValue {
    
  constructor(
    public user: Name = EMPTY_NAME,
    public last_play: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return this.user.N;
  }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user);
        enc.packNumber<u64>(this.last_play);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new Name();
            dec.unpack(obj);
            this.user = obj;
        }
        this.last_play = dec.unpackNumber<u64>();
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user.getSize();
        size += sizeof<u64>();
        return size;
    }

    static get tableName(): _chain.Name {
        return _chain.Name.fromU64(0xD615774D74000000);
    }

    static tableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        const idxTableBase: u64 = this.tableName.N & 0xfffffffffffffff0;
        const indices: _chain.IDXDB[] = [
        ];
        return indices;
    }

    getTableName(): _chain.Name {
        return UserInfo.tableName;
    }

    getTableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        return UserInfo.tableIndexes(code, scope);
    }

    getPrimaryValue(): u64 {
        return this.primary
    }

    getSecondaryValue(i: i32): _chain.SecondaryValue {
        _chain.check(false, "no secondary value!");
        return new _chain.SecondaryValue(_chain.SecondaryType.U64, new Array<u64>(0));
    }
    
    setSecondaryValue(i: i32, value: _chain.SecondaryValue): void {
        _chain.check(false, "no secondary value!");
    }


    static new(code: _chain.Name, scope: _chain.Name  = _chain.EMPTY_NAME): UserInfoDB {
        return new UserInfoDB(code, scope, this.tableName, this.tableIndexes(code, scope));
    }
}



export class LeaderboardEntryDB extends _chain.MultiIndex<LeaderboardEntry> {

}

@table("leaderboard", nocodegen)

export class LeaderboardEntry implements _chain.MultiIndexValue {
    
  constructor(
    public user: Name = EMPTY_NAME,
    public score: u64 = 0,
    public timestamp: u64 = 0
  ) {}

  @primary
  get primary(): u64 {
    return this.user.N;
  }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user);
        enc.packNumber<u64>(this.score!);
        enc.packNumber<u64>(this.timestamp);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new Name();
            dec.unpack(obj);
            this.user = obj;
        }
        this.score! = dec.unpackNumber<u64>();
        this.timestamp = dec.unpackNumber<u64>();
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user.getSize();
        size += sizeof<u64>();
        size += sizeof<u64>();
        return size;
    }

    static get tableName(): _chain.Name {
        return _chain.Name.fromU64(0x8A8C955CF435D200);
    }

    static tableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        const idxTableBase: u64 = this.tableName.N & 0xfffffffffffffff0;
        const indices: _chain.IDXDB[] = [
        ];
        return indices;
    }

    getTableName(): _chain.Name {
        return LeaderboardEntry.tableName;
    }

    getTableIndexes(code: _chain.Name, scope: _chain.Name): _chain.IDXDB[] {
        return LeaderboardEntry.tableIndexes(code, scope);
    }

    getPrimaryValue(): u64 {
        return this.primary
    }

    getSecondaryValue(i: i32): _chain.SecondaryValue {
        _chain.check(false, "no secondary value!");
        return new _chain.SecondaryValue(_chain.SecondaryType.U64, new Array<u64>(0));
    }
    
    setSecondaryValue(i: i32, value: _chain.SecondaryValue): void {
        _chain.check(false, "no secondary value!");
    }


    static new(code: _chain.Name, scope: _chain.Name  = _chain.EMPTY_NAME): LeaderboardEntryDB {
        return new LeaderboardEntryDB(code, scope, this.tableName, this.tableIndexes(code, scope));
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
    check(currentBlockNum() - info.last_play >= cooldown, "Cooldown: Can only play once every 4 hours");
    info.last_play = currentBlockNum();
    this.userinfoTable.set(info, this.receiver);
  }

  @action("claimmulti")
  claimmulti(user: Name, types: u8[]): void {
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
      entry = new LeaderboardEntry(user, score, currentBlockNum());
    } else {
      if (score > entry.score) {
        entry.score = score;
        entry.timestamp = currentBlockNum();
      }
    }
    this.leaderboardTable.set(entry, this.receiver);
  }
}


class startgameAction implements _chain.Packer {
    constructor (
        public user: _chain.Name | null = null,
    ) {
    }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user!);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new _chain.Name();
            dec.unpack(obj);
            this.user! = obj;
        }
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user!.getSize();
        return size;
    }
}

class claimmultiAction implements _chain.Packer {
    constructor (
        public user: _chain.Name | null = null,
        public types: u8[] | null = null,
    ) {
    }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user!);
        enc.packNumberArray<u8>(this.types!);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new _chain.Name();
            dec.unpack(obj);
            this.user! = obj;
        }
        
        this.types! = dec.unpackNumberArray<u8>();
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user!.getSize();
        size += sizeof<u32>() + this.types!.length * sizeof<u8>();
        return size;
    }
}

class submitscoreAction implements _chain.Packer {
    constructor (
        public user: _chain.Name | null = null,
        public score: u64 | null = null,
    ) {
    }

    pack(): u8[] {
        let enc = new _chain.Encoder(this.getSize());
        enc.pack(this.user!);
        enc.packNumber<u64>(this.score!);
        return enc.getBytes();
    }
    
    unpack(data: u8[]): usize {
        let dec = new _chain.Decoder(data);
        
        {
            let obj = new _chain.Name();
            dec.unpack(obj);
            this.user! = obj;
        }
        this.score! = dec.unpackNumber<u64>();
        return dec.getPos();
    }

    getSize(): usize {
        let size: usize = 0;
        size += this.user!.getSize();
        size += sizeof<u64>();
        return size;
    }
}

export function apply(receiver: u64, firstReceiver: u64, action: u64): void {
	const _receiver = new _chain.Name(receiver);
	const _firstReceiver = new _chain.Name(firstReceiver);
	const _action = new _chain.Name(action);

	const mycontract = new GameContract(_receiver, _firstReceiver, _action);
	const actionData = _chain.readActionData();

	if (receiver == firstReceiver) {
		if (action == 0xC64D7CB0D2500000) {//startgame
            const args = new startgameAction();
            args.unpack(actionData);
            mycontract.startgame(args.user!);
        }
		if (action == 0x444CE94B51CB8000) {//claimmulti
            const args = new claimmultiAction();
            args.unpack(actionData);
            mycontract.claimmulti(args.user!,args.types!);
        }
		if (action == 0xC68F276708A5D400) {//submitscore
            const args = new submitscoreAction();
            args.unpack(actionData);
            mycontract.submitscore(args.user!,args.score!);
        }
	}
  
	if (receiver != firstReceiver) {
		
	}
	return;
}
