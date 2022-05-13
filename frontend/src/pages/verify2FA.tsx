import React from 'react';
import { RootStateOrAny, useSelector, useDispatch } from 'react-redux';
import Cookies from 'js-cookie';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { edit, reset, logout } from '../features/auth/authSlice';


type Props = {};

function Verify2FA({}: Props) {
  const { user, isError, isLoading, isSuccess, message } = useSelector(
    (state: RootStateOrAny) => state.auth,
  );

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [QRCode, setQRCode] = useState('');
  const [writtenCode, setWrittenCode] = useState('Type 6 digits');

    
  const onChange = (e: any) => {
    setWrittenCode(e.target.value)
  };

  const onTestMFA = async (e: any) => {
    console.log('Test MFA');

    try {
      const resMFA = await axios.get(
        process.env.REACT_APP_URL_BACK + 'users/mfaverify',
        {
          params: { jwt: Cookies.get('jwt'), code: writtenCode },
        },
      );

      const validMFA = resMFA.data.mfaverification
      console.log('MFA: ', validMFA);
      
    } catch (error) {
      console.log('Request to MFA validation failed');
    }
  };


  return <div>
    <div>
          <input
            type="text"
            id="username"
            value= {writtenCode}
            onChange={onChange}
            required
          />
          </div>
          <div>
            <button className="largeButton" onClick={onTestMFA}>
              Test authenticator
            </button>
          </div>

  </div>;
}

export default Verify2FA;
