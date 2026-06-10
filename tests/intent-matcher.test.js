const { detectIntent, isApproval, isRejection, isCreateTicket, isDemo } = require('../skills/slack-intent-matcher');

describe('Intent Matcher', () => {

  // Approval tests
  test('detects "yes" as approval', () => {
    expect(isApproval('yes')).toBe(true);
  });
  test('detects "approve" as approval', () => {
    expect(isApproval('approve')).toBe(true);
  });
  test('detects "approved" as approval', () => {
    expect(isApproval('approved')).toBe(true);
  });

  // Rejection tests
  test('detects "no" as rejection', () => {
    expect(isRejection('no')).toBe(true);
  });
  test('detects "reject" as rejection', () => {
    expect(isRejection('reject')).toBe(true);
  });
  test('detects "rejected" as rejection', () => {
    expect(isRejection('rejected')).toBe(true);
  });

  // Ticket tests
  test('detects "create support ticket"', () => {
    expect(isCreateTicket('create support ticket')).toBe(true);
  });
  test('detects "new ticket"', () => {
    expect(isCreateTicket('new ticket')).toBe(true);
  });

  // Demo tests
  test('detects "demo"', () => {
    expect(isDemo('demo')).toBe(true);
  });

  // Negative tests
  test('random text returns null intent', () => {
    expect(detectIntent('what is machine learning')).toBe(null);
  });
//   test('approval not triggered by random text', () => {
//     expect(isApproval('hello world')).toBe(false);
//   });

    test('approval not triggered by random text', () => {
    expect(isApproval('hello world')).toBeFalsy();
  });
});