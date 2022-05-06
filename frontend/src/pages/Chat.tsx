import axios from 'axios';
import React, { useEffect, useRef, useState } from 'react';
import { RootStateOrAny, useSelector } from 'react-redux';
import ChatOnline from '../components/ChatOnline';
import Conversation from '../components/Conversation';
import Message from '../components/Message';
import MessageInterface from '../interfaces/MessageInterface';
import RoomInterface from '../interfaces/RoomInterface';
import './chat.css';
import { io } from 'socket.io-client';

function Chat() {
  const [conversations, setConversations] = useState<RoomInterface[]>([]);
  const [conversationsCanJoin, setConversationsCanJoin] = useState<
    RoomInterface[]
  >([]);
  const [currentChat, setCurrentChat] = useState<RoomInterface[]>([]);
  const [messages, setMessages] = useState<MessageInterface[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [arrivalMessage, setArrivalMessage] = useState<MessageInterface>({
    id: -1,
    message: '',
  });
  const [onlineUsers, setOnlineUsers] = useState<number[]>([]);
  const { user } = useSelector((state: RootStateOrAny) => state.auth);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socket = useRef(io());
  const [conversationType, setConversationType] = useState('directMessage');
  const [convName, setConvName] = useState<string>('');
  const [convPassword, setConvPassword] = useState('');
  const [convDm, setConvDm] = useState('');

  useEffect(() => {
    if (user) {
      socket.current = io('ws://localhost:5050', {
        // withCredentials: true,
        query: { id: user.id },
      });
    }
    socket.current.on('getTransmitMessage', (data) => {
      console.log('Socket message detected', data);
      if (currentChat[0] && currentChat[0].id === data.room.id)
        setArrivalMessage(data);
    });
  }, []);

  useEffect(() => {
    if (arrivalMessage) {
      if (
        arrivalMessage.id !== -1 &&
        arrivalMessage.room?.id === currentChat[0].id
      ) {
        let foundId = false;
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].id === arrivalMessage.id) {
            foundId = true;
          }
        }
        if (!foundId) {
          setMessages([...messages, arrivalMessage]);
        }
      }
    }
  }, [arrivalMessage, currentChat, messages]);

  useEffect(() => {}, [onlineUsers]);

  useEffect(() => {
    socket.current.emit('addUser', user.id);
    socket.current.on('getUsers', (u) => {
      setOnlineUsers(u);
    });
  }, [user]);

  if (!user) {
    console.log("Don't forget to login");
  }

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await axios.get(
          process.env.REACT_APP_URL_BACK + 'rooms/user/' + user.id,
        );
        setConversations(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConversations();
    const getConversationsCanJoin = async () => {
      try {
        const res = await axios.get(
          process.env.REACT_APP_URL_BACK + 'rooms/canjoin/' + user.id,
        );
        setConversationsCanJoin(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    getConversationsCanJoin();
  }, [user.id]);

  useEffect(() => {
    const getMessages = async () => {
      if (currentChat.length > 0) {
        try {
          const res = await axios.get(
            process.env.REACT_APP_URL_BACK + 'messages/' + currentChat[0].id,
          );
          setMessages(res.data);
        } catch (err) {
          console.log(err);
        }
      }
    };
    getMessages();
  }, [currentChat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.length) return;

    const msg = {
      owner: user.id,
      channelId: currentChat[0].id,
      message: newMessage,
    };

    const res = await axios.post(
      process.env.REACT_APP_URL_BACK + 'messages/',
      msg,
    );

    socket.current.emit('transmitMessage', res.data);

    setMessages([...messages, res.data]);
    setNewMessage('');
  };

  useEffect(() => {
    scrollRef.current?.scrollIntoView(); // { behavior: 'smooth' }
  }, [messages]);

  const handleSubmitConv = async (e: React.FormEvent) => {
    e.preventDefault();

    const room = {
      owner: user.id,
      isDm: conversationType === 'directMessage',
      secondMemberDm: convDm,
      category: conversationType,
      channelName: convName ? convName : '-',
      password: convPassword,
    };

    const res = await axios.post(
      process.env.REACT_APP_URL_BACK + 'rooms/',
      room,
    );

    if (res.data) {
      console.log(res.data);
      //update les conv
    }
  };

  const handleJoin = async (convId: number) => {
    console.log(convId);

    const joinDTO = {
      owner: user.id,
      convId,
    };

    const res = await axios.post(
      process.env.REACT_APP_URL_BACK + 'rooms/join/',
      joinDTO,
    );

    if (res.data) {
      console.log(res.data);
      //update les conv
    }
  };

  return (
    <>
      <div className="messenger">
        <div className="chatMenu">
          <div className="chatMenuWrapper">
            <div className="chatMenuTop">
              <h3>My Conversations</h3>
              {/* <input
                placeholder="Search For Friends"
                className="chatMenuInput"
              /> */}
              {conversations.map((c, i) => (
                <div onClick={() => setCurrentChat([c])} key={i}>
                  <Conversation
                    key={i}
                    conversation={c}
                    currentUser={user}
                    join={false}
                    handleJoin={handleJoin}
                  />
                </div>
              ))}
            </div>
            <div className="chatMenuMiddle">
              <h3>Join Conversations</h3>
              {/* <input
                placeholder="Search For Friends"
                className="chatMenuInput"
              /> */}
              {conversationsCanJoin.map((c, i) => (
                <div key={i}>
                  <Conversation
                    key={i}
                    conversation={c}
                    currentUser={user}
                    join={true}
                    handleJoin={handleJoin}
                  />
                </div>
              ))}
            </div>
            <div className="chatMenuBottom">
              <h3>Create a New Conversation</h3>
              <div className="chatNewWrapper">
                <div className="chatMenuBottomLeft">
                  <div>
                    <select
                      className="conversationType"
                      value={conversationType}
                      onChange={(e) => {
                        setConversationType(e.target.value);
                      }}
                    >
                      <option value="directMessage">Direct Message</option>
                      <option value="public">Public</option>
                      <option value="passwordProtected">
                        Password Protected
                      </option>
                    </select>
                  </div>
                  {conversationType === 'public' ||
                  conversationType === 'passwordProtected' ? (
                    <div>
                      <div className="conversationNameBox">
                        <input
                          placeholder="Conversation Name"
                          id="convName"
                          value={convName}
                          onChange={(e) => {
                            setConvName(e.target.value);
                          }}
                        />
                      </div>
                      {conversationType === 'passwordProtected' && (
                        <div className="convPassword">
                          <input
                            placeholder="Conversation Password"
                            id="convPassword"
                            value={convPassword}
                            onChange={(e) => {
                              setConvPassword(e.target.value);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="convDm">
                      <input
                        placeholder="Username"
                        id="convDm"
                        value={convDm}
                        onChange={(e) => {
                          setConvDm(e.target.value);
                        }}
                      />
                    </div>
                  )}
                </div>
                <button className="convSubmitButton" onClick={handleSubmitConv}>
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="chatBox">
          <div className="chatBoxWrapper">
            {currentChat.length ? (
              <>
                <div className="chatBoxTop">
                  {messages.map((m, i) => (
                    <div ref={scrollRef} key={i}>
                      <Message
                        key={i}
                        message={m}
                        own={m.owner?.id === user.id}
                      />
                    </div>
                  ))}
                </div>
                <div className="chatBoxBottom">
                  <textarea
                    className="chatMessageInput"
                    placeholder="write something..."
                    onChange={(e) => setNewMessage(e.target.value)}
                    value={newMessage}
                  ></textarea>
                  <button className="chatSubmitButton" onClick={handleSubmit}>
                    Send
                  </button>
                </div>
              </>
            ) : (
              <span className="noConversationText">
                Open a conversation to start a chat.
              </span>
            )}
          </div>
        </div>
        <div className="chatOnline">
          <div className="chatOnlineWrapper">
            <ChatOnline
              onlineUsers={onlineUsers}
              currentId={user.id}
              setCurrentChat={setCurrentChat}
              accessList={currentChat[0]?.accessList}
            />
          </div>
        </div>
      </div>
    </>
  );
}
export default Chat;
