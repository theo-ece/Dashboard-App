import { LevelDB } from "./leveldb"
import WriteStream from 'level-ws'
import aesjs from 'aes-js'

var key = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]

export class User {
  public username: string
  public email: string
  private password: string = ""

  constructor(username: string, email: string, password: string, passwordHashed: boolean = false) {
    this.username = username
    this.email = email

    if (!passwordHashed) {
      this.setPassword(password)
      passwordHashed = true
    } else {
      this.password = password
    } 
  }
  
  static fromDb(username: string, value: any): User {
    const [password, email] = value.split(":")
    return new User(username, email, password) 
  }

  private encrytion(word: string): string {
    // Hash and set password
    var textoBytes = aesjs.utils.utf8.toBytes(word)
    var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5)) // The counter is optional, and if omitted will begin at 1
    //var encryptedBytes = aesCtr.encrypt(textoBytes)
    //var encryptedHex = aesjs.utils.hex.fromBytes(encryptedBytes)        //To print or store the binary data, you may convert it to hex
    return aesjs.utils.hex.fromBytes(aesCtr.encrypt(textoBytes))
  }

  private ecryption(word: string): string {
    var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(5));
    return aesjs.utils.utf8.fromBytes(aesCtr.decrypt(aesjs.utils.hex.toBytes(word)));
  }

  public setPassword(toSet: string): void {
    // Hash and set password
    this.password = this.encrytion(toSet)  
  }

  public getPassword(): string {
    return this.password
  }

  public validatePassword(toValidate: String): boolean {
    // return comparison with hashed password
    return this.password == toValidate
  }
}

export class UserHandler {
  public db: any

  public get(username: string, callback: (err: Error | null, result?: User) => void) {
    this.db.get(`user:${username}`, function (err: Error, data: any) {
      if (err) callback(err)
      else if (data === undefined) callback(null, data)
      else {
        callback(null, User.fromDb(username, data))
      }
    })
  }

  public save(user: User, callback: (err: Error | null) => void) {
    this.db.put(`user:${user.username}`, `${user.getPassword()}:${user.email}`, (err: Error | null) => {
      callback(err)
    })
  }

  public delete(username: string, callback: (err: Error | null) => void) {
    // TODO
  }

  constructor(path: string) {
    this.db = LevelDB.open(path)
  }
}
