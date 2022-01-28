import { screen, waitFor } from '@testing-library/dom';
import {
  cleanupDOM,
  createInputElement,
  createDOM,
  createMultipleInputElements,
  createForm,
} from './common';
import userEvent from '@testing-library/user-event';
import { get } from 'svelte/store';
import { isFormControl } from '@felte/common';
import { FelteSubmitError } from '../src';

function createSelectElement({
  name,
  options,
}: {
  name: string;
  options: string[];
}) {
  const selectElement = document.createElement('select');
  selectElement.name = name;
  const optionElements = options.map((option) => {
    const element = document.createElement('option');
    element.value = option;
    return element;
  });
  selectElement.append(...optionElements);
  return selectElement;
}

function createLoginForm() {
  const formElement = screen.getByRole('form') as HTMLFormElement;
  const emailInput = createInputElement({
    name: 'account.email',
    type: 'email',
  });
  const passwordInput = createInputElement({
    name: 'account.password',
    type: 'password',
  });
  const submitInput = createInputElement({ type: 'submit' });
  const accountFieldset = document.createElement('fieldset');
  accountFieldset.append(emailInput, passwordInput);
  formElement.append(accountFieldset, submitInput);
  return { formElement, emailInput, passwordInput, submitInput };
}

function createSignupForm() {
  const formElement = screen.getByRole('form') as HTMLFormElement;
  const emailInput = createInputElement({
    name: 'account.email',
    type: 'email',
  });
  const passwordInput = createInputElement({
    name: 'account.password',
    type: 'password',
  });
  const showPasswordInput = createInputElement({
    name: 'account.showPassword',
    type: 'checkbox',
  });
  const confirmPasswordInput = createInputElement({
    name: 'account.confirmPassword',
    type: 'password',
  });
  const publicEmailYesRadio = createInputElement({
    name: 'account.publicEmail',
    value: 'yes',
    type: 'radio',
  });
  const publicEmailNoRadio = createInputElement({
    name: 'account.publicEmail',
    value: 'no',
    type: 'radio',
  });
  const accountTypeElement = createSelectElement({
    name: 'account.accountType',
    options: ['user', 'admin'],
  });
  const accountFieldset = document.createElement('fieldset');
  accountFieldset.append(
    emailInput,
    passwordInput,
    showPasswordInput,
    publicEmailYesRadio,
    publicEmailNoRadio,
    confirmPasswordInput,
    accountTypeElement
  );
  formElement.appendChild(accountFieldset);
  const profileFieldset = document.createElement('fieldset');
  const firstNameInput = createInputElement({ name: 'profile.firstName' });
  const lastNameInput = createInputElement({ name: 'profile.lastName' });
  const bioInput = createInputElement({ name: 'profile.bio' });
  profileFieldset.append(firstNameInput, lastNameInput, bioInput);
  formElement.appendChild(profileFieldset);
  const pictureInput = createInputElement({
    name: 'profile.picture',
    type: 'file',
  });
  formElement.appendChild(pictureInput);
  const extraPicsInput = createInputElement({
    name: 'extra.pictures',
    type: 'file',
  });
  extraPicsInput.multiple = true;
  formElement.appendChild(extraPicsInput);
  const submitInput = createInputElement({ type: 'submit' });
  const techCheckbox = createInputElement({
    type: 'checkbox',
    name: 'preferences',
    value: 'technology',
  });
  const filmsCheckbox = createInputElement({
    type: 'checkbox',
    name: 'preferences',
    value: 'films',
  });
  formElement.append(techCheckbox, filmsCheckbox, submitInput);
  const multipleFieldsetElement = document.createElement('fieldset');
  const extraTextInputs = createMultipleInputElements({
    type: 'text',
    name: 'multiple.extraText',
  });
  const extraNumberInputs = createMultipleInputElements({
    type: 'number',
    name: 'multiple.extraNumber',
  });
  const extraFileInputs = createMultipleInputElements({
    type: 'file',
    name: 'multiple.extraFiles',
  });
  const extraCheckboxes = createMultipleInputElements({
    type: 'checkbox',
    name: 'multiple.extraCheckbox',
  });
  const extraPreferences1 = createMultipleInputElements({
    type: 'checkbox',
    name: 'multiple.extraPreference',
    value: 'preference1',
  });
  const extraPreferences2 = createMultipleInputElements({
    type: 'checkbox',
    name: 'multiple.extraPreference',
    value: 'preference2',
  });
  multipleFieldsetElement.append(
    ...extraTextInputs,
    ...extraNumberInputs,
    ...extraFileInputs,
    ...extraCheckboxes,
    ...extraPreferences1,
    ...extraPreferences2
  );
  formElement.appendChild(multipleFieldsetElement);

  return {
    formElement,
    emailInput,
    passwordInput,
    confirmPasswordInput,
    showPasswordInput,
    publicEmailYesRadio,
    publicEmailNoRadio,
    firstNameInput,
    lastNameInput,
    bioInput,
    pictureInput,
    extraPicsInput,
    techCheckbox,
    filmsCheckbox,
    submitInput,
    extraTextInputs,
    extraNumberInputs,
    extraFileInputs,
    extraCheckboxes,
    extraPreferences1,
    extraPreferences2,
    accountFieldset,
    accountTypeElement,
  };
}

describe('User interactions with form', () => {
  beforeEach(createDOM);

  afterEach(cleanupDOM);

  test('Sets default data correctly', () => {
    const { form, data, cleanup } = createForm({
      onSubmit: jest.fn(),
    });
    const { formElement } = createSignupForm();
    form(formElement);
    const $data = get(data);
    expect($data).toEqual(
      expect.objectContaining({
        account: {
          email: '',
          password: '',
          confirmPassword: '',
          showPassword: false,
          publicEmail: undefined,
          accountType: 'user',
        },
        profile: {
          firstName: '',
          lastName: '',
          bio: '',
          picture: undefined,
        },
        extra: {
          pictures: expect.arrayContaining([]),
        },
        preferences: expect.arrayContaining([]),
      })
    );
    cleanup();
  });

  test('Validates default data correctly', async () => {
    type Data = {
      account: {
        email: string;
        password: string;
      };
    };
    const { form, data, errors, warnings, setTouched } = createForm<Data>({
      onSubmit: jest.fn(),
      validate: (values) => {
        const errors: {
          account: { password?: string; email?: string };
        } = { account: {} };
        if (!values.account?.email) errors.account.email = 'Must not be empty';
        if (!values.account?.password)
          errors.account.password = 'Must not be empty';
        return errors;
      },
      warn: (values: any) => {
        const warnings: {
          account: { password?: string; email?: string };
        } = { account: {} };
        if (!values.account?.password)
          warnings.account.password = 'Should be safer';
        return warnings;
      },
    });
    const { formElement } = createSignupForm();
    form(formElement);
    const $data = get(data);
    expect($data).toEqual(
      expect.objectContaining({
        account: {
          email: '',
          password: '',
          confirmPassword: '',
          showPassword: false,
          publicEmail: undefined,
          accountType: 'user',
        },
        profile: {
          firstName: '',
          lastName: '',
          bio: '',
          picture: undefined,
        },
        extra: {
          pictures: expect.arrayContaining([]),
        },
        preferences: expect.arrayContaining([]),
        multiple: {
          extraText: expect.arrayContaining([
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: '',
            },
          ]),
          extraNumber: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraFiles: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraCheckbox: expect.arrayContaining([
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: false,
            },
          ]),
          extraPreference: expect.arrayContaining([
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: [],
            },
          ]),
        },
      })
    );
    expect(get(errors)).toMatchObject({
      account: {
        email: null,
        password: null,
      },
    });
    setTouched('account.email', true);
    await waitFor(() => {
      expect(get(warnings)).toMatchObject({
        account: {
          password: ['Should be safer'],
        },
      });
      expect(get(errors)).toMatchObject({
        account: {
          email: ['Must not be empty'],
          password: null,
        },
      });
    });
    setTouched('account.password', true);
    await waitFor(() => {
      expect(get(errors)).toMatchObject({
        account: {
          email: ['Must not be empty'],
          password: ['Must not be empty'],
        },
      });
    });
  });

  test('Sets custom default data correctly', () => {
    const { form, data, isValid } = createForm({
      onSubmit: jest.fn(),
    });
    const {
      formElement,
      emailInput,
      bioInput,
      publicEmailYesRadio,
      showPasswordInput,
      techCheckbox,
      extraTextInputs,
      extraNumberInputs,
      extraCheckboxes,
      extraPreferences1,
      accountTypeElement,
    } = createSignupForm();
    emailInput.value = 'jacek@soplica.com';
    const bioTest = 'Litwo! Ojczyzno moja! ty jesteś jak zdrowie';
    bioInput.value = bioTest;
    publicEmailYesRadio.checked = true;
    showPasswordInput.checked = true;
    techCheckbox.checked = true;
    extraTextInputs[1].value = 'demo text';
    extraNumberInputs[1].value = '1';
    extraCheckboxes[1].checked = true;
    extraPreferences1[1].checked = true;
    accountTypeElement.value = 'admin';
    form(formElement);
    const $data = get(data);
    expect($data).toEqual(
      expect.objectContaining({
        account: {
          email: 'jacek@soplica.com',
          password: '',
          confirmPassword: '',
          showPassword: true,
          publicEmail: 'yes',
          accountType: 'admin',
        },
        profile: {
          firstName: '',
          lastName: '',
          bio: bioTest,
          picture: undefined,
        },
        extra: {
          pictures: expect.arrayContaining([]),
        },
        preferences: expect.arrayContaining(['technology']),
        multiple: {
          extraText: expect.arrayContaining([
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: 'demo text',
            },
            {
              key: expect.any(String),
              value: '',
            },
          ]),
          extraNumber: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: 1,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraFiles: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraCheckbox: expect.arrayContaining([
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: true,
            },
            {
              key: expect.any(String),
              value: false,
            },
          ]),
          extraPreference: expect.arrayContaining([
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: ['preference1'],
            },
            {
              key: expect.any(String),
              value: [],
            },
          ]),
        },
      })
    );
    expect(get(isValid)).toBeTruthy();
  });

  test('Input and data object get same value', () => {
    const { form, data } = createForm({
      onSubmit: jest.fn(),
    });
    const { formElement, emailInput, passwordInput } = createLoginForm();
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.com');
    userEvent.type(passwordInput, 'password');
    const $data = get(data);
    expect($data).toEqual(
      expect.objectContaining({
        account: {
          email: 'jacek@soplica.com',
          password: 'password',
        },
      })
    );
  });

  test('Calls validation function on submit', async () => {
    const validate = jest.fn(() => ({}));
    const warn = jest.fn(() => ({}));
    const onSubmit = jest.fn();
    const { form, isSubmitting } = createForm({
      onSubmit,
      validate,
      warn,
    });
    const { formElement } = createLoginForm();
    form(formElement);
    formElement.submit();
    expect(validate).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          account: {
            email: '',
            password: '',
          },
        }),
        expect.objectContaining({
          form: formElement,
          controls: Array.from(formElement.elements).filter(isFormControl),
        })
      );
      expect(get(isSubmitting)).toBeFalsy();
    });
  });

  test('Calls validation function on submit without calling onSubmit', async () => {
    type Data = {
      account: {
        email: string;
        password: string;
      };
    };
    const validate = jest.fn(() => ({ account: { email: 'Not email' } }));
    const warn = jest.fn(() => ({ account: { email: 'Not email' } }));
    const onSubmit = jest.fn();
    const { form, isValid, isSubmitting } = createForm<Data>({
      onSubmit,
      validate,
      warn,
    });
    const { formElement } = createLoginForm();
    form(formElement);
    formElement.submit();
    expect(validate).toHaveBeenCalled();
    expect(warn).toHaveBeenCalled();
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
    expect(get(isValid)).toBeFalsy();
    await waitFor(() => {
      expect(get(isSubmitting)).toBeFalsy();
    });
  });

  test('Calls validate on input', async () => {
    const validate = jest.fn(() => ({}));
    const warn = jest.fn(() => ({}));
    const onSubmit = jest.fn();
    const { form, isValid } = createForm({
      onSubmit,
      validate,
      warn,
    });
    const { formElement, emailInput } = createLoginForm();
    expect(get(isValid)).toBe(false);
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.com');
    await waitFor(() => {
      expect(validate).toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      expect(get(isValid)).toBeTruthy();
    });
  });

  test('Calls debounced validate on input', async () => {
    jest.useFakeTimers();
    const validate = jest.fn(() => ({}));
    const warn = jest.fn(() => ({}));
    const onSubmit = jest.fn();
    const { form, isValid } = createForm({
      onSubmit,
      debounced: {
        validate,
        warn,
      },
    });
    const { formElement, emailInput } = createLoginForm();
    expect(get(isValid)).toBe(false);
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.');
    jest.runOnlyPendingTimers();
    await waitFor(() => {
      expect(validate).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(get(isValid)).toBeTruthy();
    });
    userEvent.type(emailInput, 'c');
    userEvent.type(emailInput, 'o');
    userEvent.type(emailInput, 'm');
    jest.runOnlyPendingTimers();
    await waitFor(() => {
      expect(validate).toHaveBeenCalledTimes(2);
      expect(warn).toHaveBeenCalledTimes(2);
      expect(get(isValid)).toBeTruthy();
    });
    jest.useRealTimers();
  });

  test('Calls debounced validate on input with custom timeout', async () => {
    jest.useFakeTimers();
    const validate = jest.fn(() => ({}));
    const warn = jest.fn(() => ({}));
    const onSubmit = jest.fn();
    const { form, isValid } = createForm({
      onSubmit,
      debounced: {
        timeout: 1000,
        validate,
        warn,
      },
    });
    const { formElement, emailInput } = createLoginForm();
    expect(get(isValid)).toBe(false);
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.com');
    jest.runOnlyPendingTimers();
    await waitFor(() => {
      expect(validate).toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      expect(get(isValid)).toBeTruthy();
    });
    jest.useRealTimers();
  });

  test('Calls debounced validate on input with validate and warn timeout', async () => {
    jest.useFakeTimers();
    const validate = jest.fn(() => ({}));
    const warn = jest.fn(() => ({}));
    const onSubmit = jest.fn();
    const { form, isValid } = createForm({
      onSubmit,
      debounced: {
        validateTimeout: 1000,
        validate,
        warn,
        warnTimeout: 1000,
      },
    });
    const { formElement, emailInput } = createLoginForm();
    expect(get(isValid)).toBe(false);
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.com');
    jest.runOnlyPendingTimers();
    await waitFor(() => {
      expect(validate).toHaveBeenCalled();
      expect(warn).toHaveBeenCalled();
      expect(get(isValid)).toBeTruthy();
    });
    jest.useRealTimers();
  });

  test('Handles user events', () => {
    type Data = {
      account: {
        email: string;
        password: string;
        confirmPassword: string;
        showPassword: boolean;
        publicEmail?: 'yes' | 'no';
        accountType: 'user' | 'admin';
      };
      profile: {
        firstName: string;
        lastName: string;
        bio: string;
        picture: any;
      };
      extra: {
        pictures: any[];
      };
      preferences: any[];
    };
    const { form, touched, data } = createForm<Data>({
      onSubmit: jest.fn(),
    });
    const {
      formElement,
      emailInput,
      passwordInput,
      confirmPasswordInput,
      showPasswordInput,
      publicEmailYesRadio,
      firstNameInput,
      lastNameInput,
      bioInput,
      techCheckbox,
      pictureInput,
      extraPicsInput,
      extraTextInputs,
      extraNumberInputs,
      extraCheckboxes,
      extraPreferences1,
      extraFileInputs,
      accountTypeElement,
    } = createSignupForm();

    form(formElement);

    expect(get(data)).toEqual(
      expect.objectContaining({
        account: {
          email: '',
          password: '',
          confirmPassword: '',
          showPassword: false,
          publicEmail: undefined,
          accountType: 'user',
        },
        profile: {
          firstName: '',
          lastName: '',
          bio: '',
          picture: undefined,
        },
        extra: {
          pictures: expect.arrayContaining([]),
        },
        preferences: expect.arrayContaining([]),
        multiple: {
          extraText: expect.arrayContaining([
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: '',
            },
          ]),
          extraNumber: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraFiles: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraCheckbox: expect.arrayContaining([
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: false,
            },
          ]),
          extraPreference: expect.arrayContaining([
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: [],
            },
          ]),
        },
      })
    );

    const mockFile = new File(['test file'], 'test.png', { type: 'image/png' });
    userEvent.type(emailInput, 'jacek@soplica.com');
    expect(get(touched).account.email).toBe(false);
    userEvent.type(passwordInput, 'password');
    expect(get(touched).account.email).toBe(true);
    userEvent.type(confirmPasswordInput, 'password');
    userEvent.click(showPasswordInput);
    userEvent.click(publicEmailYesRadio);
    userEvent.type(firstNameInput, 'Jacek');
    userEvent.type(lastNameInput, 'Soplica');
    const bioTest = 'Litwo! Ojczyzno moja! ty jesteś jak zdrowie';
    userEvent.type(bioInput, bioTest);
    userEvent.click(techCheckbox);
    userEvent.upload(pictureInput, mockFile);
    userEvent.upload(extraPicsInput, [mockFile, mockFile]);
    userEvent.type(extraTextInputs[1], 'demo text');
    userEvent.type(extraNumberInputs[1], '1');
    userEvent.click(extraCheckboxes[1]);
    userEvent.click(extraPreferences1[1]);
    userEvent.upload(extraFileInputs[1], mockFile);
    userEvent.selectOptions(accountTypeElement, ['admin']);

    expect(get(data)).toEqual(
      expect.objectContaining({
        account: {
          email: 'jacek@soplica.com',
          password: 'password',
          confirmPassword: 'password',
          showPassword: true,
          publicEmail: 'yes',
          accountType: 'admin',
        },
        profile: {
          firstName: 'Jacek',
          lastName: 'Soplica',
          bio: bioTest,
          picture: mockFile,
        },
        extra: {
          pictures: expect.arrayContaining([mockFile, mockFile]),
        },
        preferences: expect.arrayContaining(['technology']),
        multiple: {
          extraText: expect.arrayContaining([
            {
              key: expect.any(String),
              value: '',
            },
            {
              key: expect.any(String),
              value: 'demo text',
            },
            {
              key: expect.any(String),
              value: '',
            },
          ]),
          extraNumber: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: 1,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraFiles: expect.arrayContaining([
            {
              key: expect.any(String),
              value: undefined,
            },
            {
              key: expect.any(String),
              value: mockFile,
            },
            {
              key: expect.any(String),
              value: undefined,
            },
          ]),
          extraCheckbox: expect.arrayContaining([
            {
              key: expect.any(String),
              value: false,
            },
            {
              key: expect.any(String),
              value: true,
            },
            {
              key: expect.any(String),
              value: false,
            },
          ]),
          extraPreference: expect.arrayContaining([
            {
              key: expect.any(String),
              value: [],
            },
            {
              key: expect.any(String),
              value: ['preference1'],
            },
            {
              key: expect.any(String),
              value: [],
            },
          ]),
        },
      })
    );
  });

  test('Sets default data with initialValues', () => {
    const { emailInput, passwordInput, formElement } = createLoginForm();
    const { data, form } = createForm({
      onSubmit: jest.fn(),
      initialValues: {
        account: {
          email: 'jacek@soplica.com',
          password: 'password',
        },
      },
    });
    expect(get(data)).toEqual(
      expect.objectContaining({
        account: {
          email: 'jacek@soplica.com',
          password: 'password',
        },
      })
    );

    form(formElement);

    expect(emailInput.value).toBe('jacek@soplica.com');
    expect(passwordInput.value).toBe('password');
  });

  test('Validates initial values correctly', async () => {
    type Data = {
      account: {
        email: string;
        password: string;
      };
    };
    const { data, errors, setTouched, touched } = createForm<Data>({
      onSubmit: jest.fn(),
      validate: (values: any) => {
        const errors: any = { account: {} };
        if (!values.account.email) errors.account.email = 'Must not be empty';
        if (!values.account.password)
          errors.account.password = 'Must not be empty';
        return errors;
      },
      initialValues: {
        account: {
          email: 'jacek@soplica.com',
          password: '',
        },
      },
    });
    expect(get(errors)).toEqual({
      account: {
        email: null,
        password: null,
      },
    });
    setTouched('account.email', true);
    expect(get(touched)).toEqual({
      account: {
        email: true,
        password: false,
      },
    });
    expect(get(errors)).toEqual({
      account: {
        email: null,
        password: null,
      },
    });
    setTouched('account.password', true);
    expect(get(touched)).toEqual({
      account: {
        email: true,
        password: true,
      },
    });
    await waitFor(() => {
      expect(get(errors)).toEqual({
        account: {
          email: null,
          password: ['Must not be empty'],
        },
      });
    });
    expect(get(data)).toEqual(
      expect.objectContaining({
        account: {
          email: 'jacek@soplica.com',
          password: '',
        },
      })
    );
  });

  test('calls onError', async () => {
    const formElement = screen.getByRole('form') as HTMLFormElement;
    const onError = jest.fn();
    const mockErrors = { account: { email: 'Not email' } };
    const onSubmit = jest.fn(() => {
      throw mockErrors;
    });

    const { form, isSubmitting } = createForm<any>({
      onSubmit,
      onError,
    });

    form(formElement);

    expect(onError).not.toHaveBeenCalled();

    formElement.submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(mockErrors, expect.anything());
      expect(get(isSubmitting)).toBeFalsy();
    });
  });

  test('use createSubmitHandler to override submit', async () => {
    const mockOnSubmit = jest.fn();
    const mockValidate = jest.fn();
    const mockOnError = jest.fn();
    const formElement = screen.getByRole('form') as HTMLFormElement;
    const defaultConfig = {
      onSubmit: jest.fn(),
      validate: jest.fn(),
      onError: jest.fn(),
    };
    const { form, createSubmitHandler, isSubmitting } = createForm(
      defaultConfig
    );
    const altOnSubmit = createSubmitHandler({
      onSubmit: mockOnSubmit,
      onError: mockOnError,
      validate: mockValidate,
    });

    form(formElement);

    const submitInput = createInputElement({
      type: 'submit',
      value: 'Alt Submit',
    });

    submitInput.addEventListener('click', altOnSubmit);

    formElement.appendChild(submitInput);

    userEvent.click(submitInput);

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalledTimes(1);
      expect(defaultConfig.onSubmit).not.toHaveBeenCalled();
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(defaultConfig.onError).not.toHaveBeenCalled();
      expect(mockOnError).not.toHaveBeenCalled();
      expect(get(isSubmitting)).toBeFalsy();
    });

    const mockErrors = { account: { email: 'Not email' } };
    mockOnSubmit.mockImplementationOnce(() => {
      throw mockErrors;
    });

    userEvent.click(submitInput);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(mockValidate).toHaveBeenCalledTimes(2);
      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      expect(get(isSubmitting)).toBeFalsy();
    });
  });

  test('calls submit handler without event', async () => {
    const { createSubmitHandler, isSubmitting } = createForm({
      onSubmit: jest.fn(),
    });
    const mockOnSubmit = jest.fn();
    const altOnSubmit = createSubmitHandler({ onSubmit: mockOnSubmit });
    altOnSubmit();
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(get(isSubmitting)).toBeFalsy();
    });
  });

  test('ignores inputs with data-felte-ignore', async () => {
    type Data = {
      account: {
        email: string;
        password: string;
        confirmPassword: string;
        showPassword: boolean;
        publicEmail?: 'yes' | 'no';
      };
      profile: {
        firstName: string;
        lastName: string;
        bio: string;
        picture: any;
      };
      extra: {
        pictures: any[];
      };
      preferences: any[];
    };
    const {
      formElement,
      accountFieldset,
      emailInput,
      passwordInput,
      firstNameInput,
      lastNameInput,
      publicEmailYesRadio,
    } = createSignupForm();
    accountFieldset.setAttribute('data-felte-ignore', '');
    firstNameInput.setAttribute('data-felte-ignore', '');
    const { data, form } = createForm<Data>({
      onSubmit: jest.fn(),
    });
    form(formElement);
    userEvent.type(emailInput, 'jacek@soplica.com');
    userEvent.type(passwordInput, 'password');
    userEvent.type(firstNameInput, 'Jacek');
    userEvent.type(lastNameInput, 'Soplica');
    userEvent.click(publicEmailYesRadio);
    await waitFor(() => {
      expect(get(data).profile.lastName).toBe('Soplica');
      expect(get(data).profile.firstName).toBe('');
      expect(get(data).account.email).toBe('');
      expect(get(data).account.password).toBe('');
      expect(get(data).account.publicEmail).toBe(undefined);
    });
  });

  test('transforms data', async () => {
    type Data = {
      account: {
        email: string;
        password: string;
        confirmPassword: string;
        showPassword: boolean;
        publicEmail?: boolean;
      };
      profile: {
        firstName: string;
        lastName: string;
        bio: string;
        picture: any;
      };
      extra: {
        pictures: any[];
      };
      preferences: any[];
    };
    const {
      formElement,
      publicEmailYesRadio,
      publicEmailNoRadio,
    } = createSignupForm();
    const { data, form } = createForm<Data>({
      onSubmit: jest.fn(),
      transform: (values: any) => {
        if (values.account.publicEmail === 'yes') {
          values.account.publicEmail = true;
        } else {
          values.account.publicEmail = false;
        }
        return values;
      },
    });

    form(formElement);

    userEvent.click(publicEmailYesRadio);
    await waitFor(() => {
      expect(get(data).account.publicEmail).toBe(true);
    });
    userEvent.click(publicEmailNoRadio);
    await waitFor(() => {
      expect(get(data).account.publicEmail).toBe(false);
    });
  });

  test('submits without requestSubmit', async () => {
    const onSubmit = jest.fn();
    const { form } = createForm({ onSubmit });
    const { formElement } = createLoginForm();
    formElement.requestSubmit = undefined as any;
    form(formElement);
    formElement.submit();

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  test('submits post request with default action', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: true });
    const onSuccess = jest.fn();
    const eventOnSuccess = jest.fn();
    const { form } = createForm({ onSuccess });
    const { formElement } = createLoginForm();
    formElement.action = '/example';
    formElement.method = 'post';
    formElement.addEventListener('feltesuccess', eventOnSuccess);
    form(formElement);
    formElement.submit();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/example'),
        expect.objectContaining({
          body: expect.any(URLSearchParams),
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
        }),
        expect.anything()
      );
    });
  });

  test('submits get request with default action', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: true });
    const onSuccess = jest.fn();
    const eventOnSuccess = jest.fn();
    const { form } = createForm({ onSuccess });
    const { formElement, emailInput } = createLoginForm();
    formElement.action = '/example';
    formElement.method = 'get';
    formElement.addEventListener('feltesuccess', eventOnSuccess);
    form(formElement);

    userEvent.type(emailInput, 'zaphod@beeblebrox.com');
    formElement.submit();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/example?account.email=zaphod%40beeblebrox.com&account.password='
        ),
        expect.objectContaining({
          method: 'get',
        })
      );
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          ok: true,
        }),
        expect.anything()
      );
      expect(eventOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            response: expect.objectContaining({
              ok: true,
            }),
          }),
        })
      );
    });
  });

  test('submits with default action and overriden method', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: true });
    const { form } = createForm();
    const { formElement } = createLoginForm();
    formElement.action = '/example?_method=put';
    formElement.method = 'post';
    form(formElement);
    formElement.submit();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/example'),
        expect.objectContaining({
          body: expect.any(URLSearchParams),
          method: 'put',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
    });
  });

  test('submits with default action and file input', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: true });
    const { form } = createForm();
    const { formElement } = createLoginForm();
    formElement.action = '/example';
    formElement.method = 'post';
    const fileInput = createInputElement({ name: 'profilePic', type: 'file' });
    formElement.appendChild(fileInput);
    form(formElement);
    formElement.submit();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/example'),
        expect.objectContaining({
          body: expect.any(FormData),
          method: 'post',
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );
    });
  });

  test('submits with default action and throws', async () => {
    window.fetch = jest.fn().mockResolvedValue({ ok: false });
    const onError = jest.fn();
    const eventOnError = jest.fn();
    const { form } = createForm({ onError });
    const { formElement } = createLoginForm();
    formElement.action = '/example';
    formElement.method = 'post';
    formElement.addEventListener('felteerror', eventOnError);
    form(formElement);
    formElement.submit();

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/example'),
        expect.objectContaining({
          body: expect.any(URLSearchParams),
          method: 'post',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );
      expect(onError).toHaveBeenCalledWith(
        expect.any(FelteSubmitError),
        expect.anything()
      );
      expect(eventOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            error: expect.any(FelteSubmitError),
          }),
        })
      );
    });
  });
});
