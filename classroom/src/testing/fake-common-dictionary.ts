import { CommonDictionary } from 'src/app/common-dictionary';

export const FAKE_COMMON_DICTIONARY: CommonDictionary = new CommonDictionary({
  default_dict: 'fake_dict',
  custom_dict: 'bogus_dict',
  use_default_dict: false,
  timestamp: '01/06/2021, 14:15:00',
  categories: [
    {
      label: 'Political',
      help: 'Politicians and their BS',
      subcategories: [
        {
          label: 'Impeachable',
          help: 'high crimes and misdemeanors',
          clusters: [
            {
              name: 'Insurection',
              help: 'Inciting insurection.',
              label: 'Incitiong mobs to storm capitals.',
            },
          ],
        },
      ],
    },
    {
      label: 'Tense',
      help: 'Relax',
      subcategories: [
        {
          label: 'Future Tense',
          name: 'FutureTense',
          help: 'To the future and beyond.',
          clusters: [
            {
              name: 'future',
              help: 'the future is now',
              label: 'Future',
            },
          ],
        },
      ],
    },
    {
      label: 'Helpers',
      help: 'Not for you',
      subcategories: [
        {
          label: 'Somewhat Helpful',
          name: 'Somewhat',
          help: 'Only a little bit.',
          clusters: [
            {
              name: 'facilitate',
              label: 'Facilitate',
              help: 'Please help me, I am stuck in a testing script!',
            },
          ],
        },
      ],
    },
    {
      label: 'Fake Category',
      name: 'FakeCategory',
      help: 'No help on fake',
      subcategories: [
        {
          label: 'False Subcategory',
          name: 'FalseSubcategory',
          help: 'Not true',
          clusters: [
            {
              name: 'bogus',
              label: 'Bogus Data',
              help: 'A completely bogus category.',
            },
          ],
        },
      ],
    },
  ],
});
