import { createStore, combineReducers } from 'redux';

const savedToken = localStorage.getItem('token');
const savedRole = localStorage.getItem('role');

const initialState = {
  isAuthenticated: !!savedToken,
  userRole: savedRole || null,
  token: savedToken || null,
};

const SET_USER = 'SET_USER';
const LOGOUT = 'LOGOUT';

export const setUser = (role, token) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);

  return {
    type: SET_USER,
    payload: { role, token },
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');

  return { type: LOGOUT };
};

const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        isAuthenticated: true,
        userRole: action.payload.role,
        token: action.payload.token,
      };
    case LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        userRole: null,
        token: null,
      };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  auth: authReducer,
});

const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
);

export default store;