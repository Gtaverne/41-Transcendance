import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersEntity } from 'src/users/users.entity';
import { Repository } from 'typeorm';
import { CreateRoomDTO } from './dto/create-room.dto';
import { RoomDTO } from './dto/room.dto';
import { RoomsEntity } from './rooms.entity';
import { UsersService } from 'src/users/users.service';
import { identity } from 'rxjs';
import { JoinRoomDTO } from './dto/join-room';
import { hash, genSalt, compare } from 'bcrypt';
import { ChangeRoleDTO } from './dto/change-status.dto';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomsEntity)
    private roomsRepository: Repository<RoomsEntity>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async changeOwner(data: ChangeRoleDTO) {
	console.log(data);
	console.log("---------------------------------", data.appointedId);
	const room = await this.roomsRepository.findOne({
      where: { id: data.channelId },
      relations: ['owner'],
    });
	console.log("room", room);
	const newOwner = await this.usersService.findOne(data.appointedId);
	console.log("newOwner", newOwner);
	// console.log("room.owner.id", room.owner.id);
	// console.log("data.user.id", data.user.id);

	if (room.owner.id !== data.user.id) {
		console.log("User Request is not comming from Owner")
		return false;
	}
	room.owner = newOwner;
	await this.roomsRepository.save(room);
    return true;
  }

  async create(createRoom: CreateRoomDTO) {
    console.log(createRoom);
    const newRoom = await this.roomsRepository.create();
    const user1 = await this.usersService.findOne(createRoom.owner);
    console.log(user1);

    if (createRoom.category === 'directMessage') {
      const user2 = await this.usersService.findOneWithName(
        createRoom.secondMemberDm,
      );
      if (!user1 || !user2 || user1 === user2) {
        console.log('One of the users is was not found or duplicate');
        return;
      }
      console.log(user2);
      newRoom.accessList = [user1, user2];
      newRoom.category = createRoom.category;
      newRoom.owner = user1;
      newRoom.isDm = true;
      newRoom.channelName = createRoom.channelName;
    } else if (createRoom.category === 'public') {
      if (
        createRoom.channelName === '-' ||
        createRoom.channelName.length >= 300
      ) {
        console.log('Wrong Data');
        return;
      }
      newRoom.accessList = [user1];
      newRoom.category = createRoom.category;
      newRoom.owner = user1;
      newRoom.channelName = createRoom.channelName;
    } else if (createRoom.category === 'passwordProtected') {
      if (
        createRoom.channelName === '-' ||
        createRoom.channelName.length >= 300 ||
        createRoom.password.length >= 200
      ) {
        console.log('Wrong Data');
        return;
      }
      const salt = await genSalt(10);
      const hashedPassword = await hash(createRoom.password, salt);
      newRoom.accessList = [user1];
      newRoom.category = createRoom.category;
      newRoom.owner = user1;
      newRoom.channelName = createRoom.channelName;
      newRoom.password = hashedPassword;
    } else {
      console.log('Room Category Not Valid Sorry');
      return;
    }

    await this.roomsRepository.save(newRoom);
    // console.log('We added to the db:', newRoom);
    return newRoom;
  }

  async join(join: JoinRoomDTO) {
    console.log(0, join);
    const user = await this.usersService.accessListUser(join.owner);
    const room = await this.roomsRepository.findOne(join.convId);
    if (!user || !room) return;

    // console.log(1, join.password);
    // const salt = await genSalt();
    // console.log(2, salt);
    // const hashedPassword = await hash(join.password, salt);
    // console.log(3, hashedPassword);
    const res = await compare(join.password, room.password);
    // console.log(4, res);

    if (join.private && !res) {
      console.log('Wrong Password, Access to the Room Denied');
      return;
    }
    // console.log(room.password, '-', join.password, join.private);
    // console.log(user.accessToList);
    // console.log('-------------------------------------------');
    user.accessToList.push(room);
    // console.log(user.accessToList);
    this.usersService.save(user);
    return room;
  }

  async findRooms(userId: number) {
    return this.usersService.accessList(userId);
  }

  //Bonus: Make this function more compact for real
  async findRoomsCanJoin(userId: number) {
    const accessList = await this.usersService.accessList(userId);
    const accessListNum = [];
    for (let i = 0; i < accessList.length; i++)
      accessListNum.push(accessList[i].id);
    const allRooms = await this.roomsRepository.find();
    const ret = [];
    for (let i = 0; i < allRooms.length; i++) {
      if (allRooms[i].isDm === false && !accessListNum.includes(allRooms[i].id))
        ret.push(allRooms[i]);
    }
    // console.log("I can join", ret.length, "rooms");
    return ret;
  }

  async findOne(roomId: number) {
    const user = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['muteList', 'banList', 'accessList', 'owner', 'admins'],
    });
    return user;
  }

  findAll() {
    return `This action returns all tuto`;
  }

  async findRoomUsers(roomId: number) {
    const users = await this.roomsRepository.findOne({
      where: { id: roomId },
      relations: ['accessList'],
    });
    return users.accessList;
  }
}
