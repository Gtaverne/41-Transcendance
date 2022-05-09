import { RootStateOrAny, useSelector, useDispatch } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import apiGetter from '../features/apicalls/apiGetter';
import { login, edit, reset } from '../features/auth/authSlice';

import UserInterface from '../interfaces/UserInterface';
import { FaSignOutAlt, FaUser, FaLock } from 'react-icons/fa';

type Props = {};

const UserProfile = (props: Props) => {
  let noloop = 0; //Not required in production
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editProfile, setEditProfile] = useState(false);

  const { user, iFollowList, iBlockedList, isError, isLoading, isSuccess, message } = useSelector(
    (state: RootStateOrAny) => state.auth,
  );

  var profile = user;
  const [fetchedProfile, setFetchedProfile] = useState(profile);
  const [queryData, setQueryData] = useState({
    query: '',
  });

  const onMutate = (e: any) => {
    setFetchedProfile((prevState: any) => ({
      ...prevState,
      [e.target.id]: e.target.value,
    }));
  };

  const onMfa = () => {
    if (user && fetchedProfile.id === user.id) {
      if (user.doublefa === 0) {
        // var tmp = new UserIterface
        console.log('Activate 2fa');
        navigate(`/configure2fa/${user.id}`)
        dispatch (reset)

      } else {
        console.log('Deactivate 2fa');
        dispatch (reset)
        //BENJAMIN: exemple de dispatch(edit(...))
        dispatch(edit({id: user.id, field: 'doublefa', value: 0}))
      }
    }
  };

  const [results, setResults] = useState('');

  const params = useParams();

  useEffect(() => {
    if (noloop === 0) {
      noloop = 1;

      const fetchUser = async () => {
        const userData = await apiGetter('users/' + params.id);
        if (userData) {
          setFetchedProfile({ ...userData });
        }
      };
      fetchUser();
    }
    dispatch(reset)
  }, [dispatch, params, login, user, iFollowList, iBlockedList]);

  const onBlock = async () => {
    if (user ) {
      if (iBlockedList.includes(fetchedProfile.id)) {
        console.log('unblock');
        dispatch(edit({id: user.id, field: 'iBlockedList', value: ['unblock', fetchedProfile.id]}))
      }
    }
  };

  const onFollow = async () => {};

  return (
    <div className="userProfile">
      <div></div>
      {user && user.id && user.id === fetchedProfile.id ? (
        <>
          <h2>Welcome home</h2>
          <button
            className="logButton"
            color="#f194ff"
            onClick={() => {
              // editProfile && console.log('ready to edit');
              setEditProfile((prevState) => !prevState);
            }}
          >
            <FaSignOutAlt />
            Edit
          </button>
        </>
      ) : (
        <>
          <h3>Another player</h3>

          <button className="largeButton" onClick={onFollow}>
            <FaUser />
            {iFollowList.includes(fetchedProfile.id) ? 'un' : '' }follow
          </button>

          <button className="largeButton" onClick={onBlock}>
            <FaSignOutAlt />
            {iBlockedList.includes(fetchedProfile.id) ? 'un' : '' }block
          </button>
        </>
      )}

      <div></div>
      <img className="profilepage" src={fetchedProfile.avatar} />
      {editProfile ? (
        <>
          <input
            type="text"
            id="username"
            value={fetchedProfile.username}
            onChange={onMutate}
            required
          />
        </>
      ) : (
        <p>Username: {fetchedProfile.username}</p>
      )}
      <p>email: {fetchedProfile.email}</p>

      {user && user.id && user.id === fetchedProfile.id ? (
      <p>
        Double Factor Authentication: 
        {fetchedProfile.doublefa === 0 ? (
          <>
             deactivated
            <button className="largeButton" onClick={onMfa}>
              <FaLock />
              Activate 2fa
            </button>
          </>
        ) : (
          <>
             activated
            <button className="largeButton" onClick={onMfa}>
              <FaLock />
              Deactivate 2fa
            </button>
          </>
        )}
      </p> )
      : 
      (<>
      </>)}
    </div>
  );
};

export default UserProfile;
