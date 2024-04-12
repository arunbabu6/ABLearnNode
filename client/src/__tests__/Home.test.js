import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Home from '../pages/Home/Home'; // Assuming this is the correct path to your Home component

// Mocking the useAuth0 hook
jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: jest.fn(),
  }),
}));

describe('Home component', () => {
  test('renders the component', () => {
    const { getByText, getByAltText } = render(<Home />);
    
    expect(getByText("Nausicca's")).toBeInTheDocument();
    expect(getByText('Green')).toBeInTheDocument();
    expect(getByText('A small business is as good as its tools.')).toBeInTheDocument();
    expect(getByText(/Empowering positive change/i)).toBeInTheDocument();
    expect(getByText('Sign Up')).toBeInTheDocument();
    expect(getByAltText('plant2')).toBeInTheDocument();
  });

  test('clicking on Sign Up button calls loginWithRedirect', () => {
    const { getByText } = render(<Home />);
    const signUpButton = getByText('Sign Up');
    fireEvent.click(signUpButton);
    
    // Assert that loginWithRedirect function is called
    expect(useAuth0().loginWithRedirect).toHaveBeenCalledTimes(1);
  });

  // You can write more tests for other functionalities as needed
});
