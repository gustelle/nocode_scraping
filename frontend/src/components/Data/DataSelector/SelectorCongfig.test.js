
import React from 'react';
import { render, fireEvent, prettyDOM, queryByTestId } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../tests/i18n';
import socketIOClient from 'socket.io-client';
import MockedSocket from 'socket.io-mock';


import { getContent, validateCssSelector } from '../../../socket/scraping';
import { SelectorConfig } from './SelectorConfig';
import { SocketContext } from '../../../socket';


/**
 * mock socketio
 * 
 * /!\ not mocking this part would lead to
 * setImmediate is not defined
 * because it would try to make requests using setImmediate
 */
jest.mock('socket.io-client');

/**
 * mock the evaluate function
 * so that it returns a correct ScrapingResponse
 */
jest.mock('../../../socket/scraping', () => ({

    // callback would be a jest mock
    // for example a simple jest.fn()
    getContent: (socket, { }, selector, url, cookiePopupPath, callback) => {

        const responseMap = {
            // return a ScrapingResponse {
            //     screenshot: string;
            //     content: string | null;
            //     status: ScrapingStatus.SUCCESS;
            //     selector: DataSelector;
            //      clickBefore?: Array<DataSelector | undefined>;
            // }
            '.a-good-selector': {
                screenshot: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
                content: 'yeah baby',
                status: 'success',
                selector: {
                    // DataSelector {
                    //     path: string | undefined;
                    //     language?: 'css' | 'xpath' | 'jsonld' | 'js';
                    //     status?: SelectorStatus
                    // }
                    path: '.a-good-selector',
                    status: 'valid'
                }
            },
            '.a-good-selector-with-popup': {
                screenshot: 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=',
                content: 'yeah baby',
                status: 'success',
                selector: {
                    // DataSelector {
                    //     path: string | undefined;
                    //     language?: 'css' | 'xpath' | 'jsonld' | 'js';
                    //     status?: SelectorStatus
                    // }
                    path: '.a-good-selector-with-popup',
                    status: 'valid'
                },
                clickBefore: [{
                    path: '.a-popup-selector',
                    status: 'valid'
                }]
            },
            '.a-bad-selector': {
                screenshot: undefined,
                content: undefined,
                status: 'success',
                selector: {
                    // DataSelector {
                    //     path: string | undefined;
                    //     language?: 'css' | 'xpath' | 'jsonld' | 'js';
                    //     status?: SelectorStatus
                    // }
                    path: '.a-bad-selector',
                    status: 'invalid'
                }
            },
            '.a-error-selector': {
                // ScrapingError {
                //     message: string;
                //     status: ScrapingStatus.ERROR | ScrapingStatus.NO_CONTENT | ScrapingStatus.ELEMENT_NOT_FOUND | ScrapingStatus.INVALID_SELECTOR;
                //     selector: DataSelector
                // }
                message: 'an backend error occured',
                status: 'error',
                selector: {
                    // DataSelector {
                    //     path: string | undefined;
                    //     language?: 'css' | 'xpath' | 'jsonld' | 'js';
                    //     status?: SelectorStatus
                    // }
                    path: '.a-error-selector',
                    status: 'invalid'
                }
            }
        }
        // mock a ScrapingResponse object
        // made up of content + screenshot 
        return callback(responseMap[selector.path]);
    },

    // need to mock the validateCssSelector
    // as well because of the pop up selector input
    // which we'll activate or not depending on the test
    // callback would be a jest mock
    // for example a simple jest.fn()
    validateCssSelector: (socket, { }, s, callback) => {
        // the response can be DataSelectorValidityResponse | DataSelectorValidityError
        const pathToCallback = {
            '.a-popup-selector': {
                selector: {
                    path: '.a-popup-selector',
                    status: "valid"
                },
                status: "success"
            },
        };
        return callback(pathToCallback[s.path]);
    }
}));


const onConfigured = (selector) => { };
const onError = () => { };
const onChange = () => { };

const testDataUndefinedSelector = {
    name: 'test-data',
};

const testData = {
    name: 'test-data',
    selector: {
        path: '.a-path'
    }
};

const undefinedSelector = undefined;

const sampleURL = new URL("https://developer.mozilla.org");


describe('Component initiation', () => {

    let socket;

    beforeEach(() => {
        socket = new MockedSocket();
        socketIOClient.mockReturnValue(socket);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });


    test('the component is correctly initiated with an undefined selector', async () => {

        const { getByTestId, queryByTestId } = render(
            <SocketContext.Provider value={socket}>
                <I18nextProvider i18n={i18n}>
                    <SelectorConfig data={testDataUndefinedSelector} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} onChange={onChange} />
                </I18nextProvider>
            </SocketContext.Provider>
        );

        // access the textarea input DOM Element
        // and check the data-* attributes
        // which hold the states of the component
        const input = getByTestId('selector-input');

        // data-selector-path is initiated with '' when undefined
        expect(input.value).toBe('')

        // the evaluation button should not be enabled
        const evaluationBtn = getByTestId('evaluation-button');
        expect(evaluationBtn).not.toBeEnabled();

        // no preview is displayed
        const preview = queryByTestId('preview-content');
        expect(preview).not.toBeInTheDocument();

    });

    test('the component is correctly initiated when a selector is passed', async () => {

        const { getByTestId, queryByTestId } = render(
            <SocketContext.Provider value={socket}>
                <I18nextProvider i18n={i18n}>
                    <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} onChange={onChange} />
                </I18nextProvider>
            </SocketContext.Provider>
        );

        // access the textarea input DOM Element
        // and check the data-* attributes
        // which hold the states of the component
        const input = getByTestId('selector-input');
        expect(input.value).toBe(testData.selector.path);

        // the evaluation button should be enabled
        const evaluationBtn = getByTestId('evaluation-button');
        expect(evaluationBtn).toBeEnabled();

        // no preview is displayed
        const preview = queryByTestId('preview-content');
        expect(preview).not.toBeInTheDocument();

    });

});

describe('When the user evaluates the content scraping', () => {

    let socket;

    beforeEach(() => {
        socket = new MockedSocket();
        socketIOClient.mockReturnValue(socket);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('when the evaluation is successful', async () => {

        const mockOnChange = jest.fn();
        const onConfigured = jest.fn();

        const testData = {
            name: 'test-data',
            selector: {
                path: '.a-good-selector'
            }
        };

        const { getByTestId, queryByTestId } = render(
            <SocketContext.Provider value={socket}>
                <I18nextProvider i18n={i18n}>
                    <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} onChange={mockOnChange} />
                </I18nextProvider>
            </SocketContext.Provider>
        );

        // simulate a user click on the evaluation button 
        const evaluateBtn = getByTestId('evaluate_selector');
        fireEvent.click(evaluateBtn);

        // evaluation is supposed to be displayed
        const preview = queryByTestId('preview-success-message');
        expect(preview).toBeInTheDocument();

        // // and onConfigured to be called
        expect(onConfigured.mock.calls.length).toBe(1);
        expect(onConfigured.mock.calls[0][0]).toStrictEqual({ "name": "test-data", "selector": { "path": ".a-good-selector", "status": "valid" } });

    });

});

describe('When the popup selector is activated', () => {

    let socket;

    beforeEach(() => {
        socket = new MockedSocket();
        socketIOClient.mockReturnValue(socket);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('when the switch button is activated', async () => {

        const mockOnChange = jest.fn();
        const onConfigured = jest.fn();

        const testData = {
            name: 'test-data',
            selector: {
                path: '.a-good-selector-with-popup'
            }
        };

        const { getByTestId, getByRole } = render(
            <SocketContext.Provider value={socket}>
                <I18nextProvider i18n={i18n}>
                    <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} onChange={mockOnChange} />
                </I18nextProvider>
            </SocketContext.Provider>
        );

        const switchbtn = getByRole('switch');
        fireEvent.click(switchbtn);

        // assert a new input appears to enter a popup selector path
        const pp = getByTestId('popup-selector-intro');
        expect(pp).toBeInTheDocument();

        // set a value in the popup select
        const ppInput = getByTestId('popup-selector-input');
        expect(ppInput).toBeInTheDocument();
        fireEvent.change(ppInput, { target: { value: '.a-popup-selector' } });

        const evaluateBtn = getByTestId('evaluate_selector');
        fireEvent.click(evaluateBtn);

        // the "clickBefore" prop is not conveyed to the data
        // because it is not part of the data itself
        expect(onConfigured.mock.calls.length).toBe(1);
        expect(onConfigured.mock.calls[0][0]).toStrictEqual({ "name": "test-data", "selector": { "path": ".a-good-selector-with-popup", "status": "valid" } });

    });

});

describe('When the evaluation is running', () => {
});

describe('When the evaluation is running', () => {
    // display of loading message...
    // evaluation-button is hidden
});

describe('When the evaluation is available', () => {
});

describe('When there is a backend error', () => {
});


// describe('Action buttons', () => {

//     let socket;

//     beforeEach(() => {
//         socket = new MockedSocket();
//         socketIOClient.mockReturnValue(socket);
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     test('evaluation is enabled when the selector url and CSS path are not blank', async () => {

//         const { getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         const input = getByTestId('selectorPathInput');

//         // simulate a user input 
//         fireEvent.change(input, { target: { value: '.a-selector' } });

//         const evaluateBtn = getByTestId('evaluate_selector');
//         expect(evaluateBtn).toBeEnabled()


//     });

//     test('the cookie popup path is passed when the sitch button is activated', async () => {



//     });

//     test('the cookie popup path is not passed when the sitch button is deactivated, even if the path is set', async () => {



//     });

//     test('CSS validity check is enabled when the CSS path is not blank', async () => {

//         const { getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         const input = getByTestId('selectorPathInput');

//         // simulate a user input 
//         fireEvent.change(input, { target: { value: '.a-selector' } });

//         const validityBtn = getByTestId('check_validity');
//         expect(validityBtn).toBeEnabled();

//     });

//     test('the bypass switch appears only when the CSS path is not blank', async () => {

//         // see https://stackoverflow.com/questions/52783144/how-do-you-test-for-the-non-existence-of-an-element-using-jest-and-react-testing
//         // queryBy* queries return the first matching node for a query, and return null if no elements match
//         // getBy* throws an error when not finding an elements
//         const { queryByTestId, getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         // at the beginning the switch button is not there
//         const switchBtn = queryByTestId('bypass_evaluation_switch');
//         expect(switchBtn).toBeNull();

//         // simulate a user input 
//         const input = getByTestId('selectorPathInput');

//         fireEvent.change(input, { target: { value: '.a-selector' } });

//         // refetch the button
//         // and check that it appeared in the document
//         const switchBtn2 = queryByTestId('bypass_evaluation_switch');
//         expect(switchBtn2).toBeInTheDocument();

//     });

// });


// describe('Call to the onConfigured callback', () => {

//     let socket;

//     beforeEach(() => {
//         socket = new MockedSocket();
//         socketIOClient.mockReturnValue(socket);
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     // TODO
//     // what means successful ?
//     // assert ScrapingStatus.SUCCESS
//     test('onConfigured callback is called when the evaluation status is successful', async () => {

//         // a dummy mock
//         // that we'll observe to check the behaviour of 
//         // the inner evaluateSelectorPath function
//         const mockOnConfigured = jest.fn();


//         const { getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={mockOnConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         // simulate a user input 
//         const input = getByTestId('selectorPathInput');
//         fireEvent.change(input, { target: { value: '.a-good-selector' } });

//         // simulate click on the evaluate button 
//         const btn = getByTestId('evaluate_btn');
//         fireEvent.click(btn);

//         expect(mockOnConfigured.mock.calls.length).toBe(1);

//     });

//     test('onConfigured callback is called when the user bypassed the evaluation', async () => {

//         // a dummy mock
//         // that we'll observe to check the behaviour of 
//         // the inner evaluateSelectorPath function
//         const mockOnConfigured = jest.fn();

//         const { getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={mockOnConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         // simulate a user input 
//         const input = getByTestId('selectorPathInput');
//         fireEvent.change(input, { target: { value: '.a-bypassed-eval' } });

//         // simulate a bypass of the evaluation
//         const switchBtn = getByTestId('bypass_evaluation_switch');
//         fireEvent.click(switchBtn);

//         expect(mockOnConfigured.mock.calls.length).toBe(1);

//     });

// });


// describe('Call to the onError callback', () => {

//     let socket;


//     beforeEach(() => {
//         socket = new MockedSocket();
//         socketIOClient.mockReturnValue(socket);
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     // TODO
//     // assert ScrapingStatus.NO_CONTENT
//     test('onError callback is called when the evaluation status is not succesful', async () => {


//         // a dummy mock
//         // that we'll observe to check the behaviour of 
//         // the inner evaluateSelectorPath function
//         const mockOnError = jest.fn();

//         const { getByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={mockOnError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         // simulate a user input 
//         const input = getByTestId('selectorPathInput');
//         fireEvent.change(input, { target: { value: '.a-bad-selector' } });

//         // simulate click on the evaluate button 
//         const btn = getByTestId('evaluate_btn');
//         fireEvent.click(btn);

//         expect(mockOnError.mock.calls.length).toBe(1);

//     });

// });

// describe('Behaviour in case of backend technical error', () => {

//     let socket;


//     beforeEach(() => {
//         socket = new MockedSocket();
//         socketIOClient.mockReturnValue(socket);
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     // TODO
//     // assert ScrapingStatus.ERROR
//     test('', async () => {




//     });

// });

// describe('Screenshot display', () => {

//     let socket;

//     beforeEach(() => {
//         socket = new MockedSocket();
//         socketIOClient.mockReturnValue(socket);
//     });

//     afterEach(() => {
//         jest.restoreAllMocks();
//     });

//     test('the screenshot is displayed only when available', async () => {

//         // simulate the call to a successfull evaluation

//         const { getByTestId, queryByTestId } = render(
//             <SocketContext.Provider value={socket}>
//                 <I18nextProvider i18n={i18n}>
//                     <SelectorConfig data={testData} sampleUrl={sampleURL} onConfigured={onConfigured} onError={onError} />
//                 </I18nextProvider>
//             </SocketContext.Provider>
//         );

//         // simulate a user input 
//         const input = getByTestId('selectorPathInput');
//         fireEvent.change(input, { target: { value: '.a-good-selector' } });

//         // at the beginning the screenshot is not there
//         const img = queryByTestId('screenshot');
//         expect(img).toBeNull();

//         // simulate click on the evaluate button 
//         const btn = getByTestId('evaluate_btn');
//         fireEvent.click(btn);

//         // now the screenshot should be displayed
//         // refetch it and check it's there
//         const img2 = queryByTestId('screenshot');
//         expect(img2).toBeInTheDocument();

//     });

// });
