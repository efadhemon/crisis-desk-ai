import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import Handlebars from 'handlebars';
import * as path from 'path';
import * as Util from 'util';
import { GenericObject } from '../types';
const ReadFile = Util.promisify(fs.readFile);

@Injectable()
export class HtmlHelper {
  public async createHtmlContent(data: GenericObject, templateType: string): Promise<string> {
    try {
      const templatePath = path.join(
        process.cwd(),
        `views/pdf-templates/${templateType}.template.hbs`,
      );
      const content = await ReadFile(templatePath, 'utf8');

      Handlebars.registerHelper('parseDate', function (date) {
        return new Date(date).toLocaleDateString();
      });

      Handlebars.registerHelper('addOne', function (index) {
        return index + 1;
      });

      Handlebars.registerHelper(
        'convertAmountToWords',
        function convertAmountToWords(number, currencyPrefix = '') {
          const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
          const teens = [
            '',
            'Eleven',
            'Twelve',
            'Thirteen',
            'Fourteen',
            'Fifteen',
            'Sixteen',
            'Seventeen',
            'Eighteen',
            'Nineteen',
          ];
          const tens = [
            '',
            'Ten',
            'Twenty',
            'Thirty',
            'Forty',
            'Fifty',
            'Sixty',
            'Seventy',
            'Eighty',
            'Ninety',
          ];

          const numToString = (num: number): string => {
            if (num === 0) return '';
            else if (num < 10) return ones[num];
            else if (num === 10)
              return 'Ten'; // Handle 10 separately
            else if (num < 20) return teens[num - 10];
            else if (num < 100) return tens[Math.floor(num / 10)] + ' ' + ones[num % 10];
            else if (num < 1000)
              return ones[Math.floor(num / 100)] + ' Hundred ' + numToString(num % 100);
            else if (num < 1000000)
              return numToString(Math.floor(num / 1000)) + ' Thousand ' + numToString(num % 1000);
            else if (num < 1000000000)
              return (
                numToString(Math.floor(num / 1000000)) + ' Million ' + numToString(num % 1000000)
              );
            else if (num < 1000000000000)
              return (
                numToString(Math.floor(num / 1000000000)) +
                ' Billion ' +
                numToString(num % 1000000000)
              );
            else return 'Number too large to convert';
          };

          if (number === 0) return 'Zero' + ' ' + currencyPrefix + ' Only';
          else if (number < 0)
            return 'Negative ' + numToString(-number) + ' ' + currencyPrefix + ' Only';
          else return numToString(number) + ' ' + currencyPrefix + ' Only';
        },
      );

      Handlebars.registerHelper('parseValue', function (value) {
        return value !== undefined ? value : 'N/A';
      });

      Handlebars.registerHelper('compare', (v1, v2, operator, options) => {
        switch (operator) {
          case '==':
            return v1 == v2 ? options.fn(this) : options.inverse(this);
          case '===':
            return v1 === v2 ? options.fn(this) : options.inverse(this);
          case '!=':
            return v1 != v2 ? options.fn(this) : options.inverse(this);
          case '!==':
            return v1 !== v2 ? options.fn(this) : options.inverse(this);
          case '<':
            return v1 < v2 ? options.fn(this) : options.inverse(this);
          case '<=':
            return v1 <= v2 ? options.fn(this) : options.inverse(this);
          case '>':
            return v1 > v2 ? options.fn(this) : options.inverse(this);
          case '>=':
            return v1 >= v2 ? options.fn(this) : options.inverse(this);
          default:
            throw new Error('Invalid operator provided');
        }
      });

      Handlebars.registerHelper('arithmetic', function (v1, operator, v2, _options) {
        v1 = parseFloat(v1);
        v2 = parseFloat(v2);

        switch (operator) {
          case '+':
            return v1 + v2;
          case '-':
            return v1 - v2;
          case '*':
            return v1 * v2;
          case '/':
            return v2 !== 0 ? v1 / v2 : 'Error: Division by zero';
          default:
            throw new Error('Invalid operator provided');
        }
      });

      const template = Handlebars.compile(content);

      return template(data);
    } catch {}
  }
}
