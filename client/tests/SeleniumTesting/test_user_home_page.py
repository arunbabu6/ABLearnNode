

import time
import unittest
from faker import Faker
from selenium import webdriver
import pages as page
from locators import VARIABLES, SignInPageLocators, ContentPageLocators, FundCardLocators


class Nausicca_Home_Page(unittest.TestCase):
    """ Test cases will be written here """

    def setUp(self) -> None:
        # self.driver = webdriver.Chrome()
        # self.driver = webdriver.Firefox()
        self.driver = webdriver.Edge()
        self.driver.get(VARIABLES.URL)

    def test_verify_if_home_page_is_opening(self):
        main_page = page.HomePage(self.driver)

        self.assertTrue(main_page.is_title_matches())
        self.assertEqual(main_page.click_signIn_button().text, "Sign Up")

    def tearDown(self) -> None:
        self.driver.quit()

class Nausicca_User_Home_Page(unittest.TestCase):
    def setUp(self):
        """ Initialization of the driver """
        # self.driver = webdriver.Chrome()
        # self.driver = webdriver.Firefox()
        self.driver = webdriver.Edge()
        self.driver.get(VARIABLES.URL)

        # Navigate to SignIn page
        self.signIn_page = page.SignInPage(self.driver)
        self.signIn_page.navigate_to_sign_in_page()

        # Content page after the user sign ups
        self.content_page = page.ContentPage(self.driver)

        # singing in
        creds = (SignInPageLocators.USER_EMAIL, SignInPageLocators.USER_PASSWORD)
        self.signIn_page.sign_in(*creds)

        # Initiating Faker for generatingq fake data
        self.fake = Faker()

    def test_verify_that_the_User_Home_Page_displays_the_user_email_and_profile_picture(self):
        """ Test 1. """

        # Assertions
        self.assertIsNotNone(self.content_page.profile_cirlce())
        self.assertEqual(self.content_page.get_email().text, SignInPageLocators.USER_EMAIL)

    def test_verify_user_home_page_displays_all_relevant_information_and_features_that_the_user_has_access(self):
        """ Test 2. """
        # Assertions
        self.assertIsNotNone(self.content_page.profile_cirlce())
        self.assertEqual(self.content_page.get_email().text, SignInPageLocators.USER_EMAIL)
        self.assertIsNotNone(self.driver.find_element(*ContentPageLocators.LOGO_IMG))

    def test_verify_if_we_are_able_to_see_different_Funds_available(self):
        """ Test 3. """

        self.assertTrue(self.content_page.check_if_cards_present())

    def test_verify_if_we_are_able_to_click_on_the_different_Fund_cards(self):
        """ Test 4. """

        # Clicking on card
        self.content_page.click_amount_button()

        applciation_label = self.content_page.get_custom_txt_present(FundCardLocators.GRANT_APPLICATION)
        project_label = self.content_page.get_custom_txt_present(FundCardLocators.PROJECT_DESCRIPTION_LABEL)
        amount_label = self.content_page.get_custom_txt_present(FundCardLocators.AMOUT_LABEL)
        
        # Assertions
        self.assertEqual(applciation_label, "Grant Application")
        self.assertEqual(project_label, "Project Description:")
        self.assertEqual(amount_label, "Requested Amount:")

    def test_verify_footer_information(self):
        """ Test 5. """

        # Fetching Footer Label
        footer_label = self.content_page.get_custom_txt_present(FundCardLocators.RIGHT_FOOTER)

        # Assertions
        self.assertIn(footer_label.split("|")[0], "About Us ")
        self.assertIn(footer_label.split("|")[1], " Services ")
        self.assertIn(footer_label.split("|")[2], " Contact")

    def test_verify_if_all_rights_reserved_is_present_in_footer(self):
        """ Test 6. """

        rights_reserved_label = self.content_page.get_custom_txt_present(FundCardLocators.RIGHTS_RESERVED)

        # Assertions
        self.assertEqual(rights_reserved_label, "© 2024 Nausicca. All rights reserved.")

    def test_verify_if_contact_information_is_present_in_footer_page(self):
        """ Test 7. """

        rights_reserved_label = self.content_page.get_custom_txt_present(FundCardLocators.CONTACT)

        # Assertions
        self.assertEqual(rights_reserved_label, "Contact us: info@nausicca.com | 000-000-0000")

    def tearDown(self) -> None:
        self.driver.quit()

if __name__ == "__main__":
    unittest.main()