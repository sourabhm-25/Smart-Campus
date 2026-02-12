Queen Ratnamanjuri had a will written that described her fortune of *ratnas* (precious stones) and also included a puzzle. Her son Khoisnam and their 99 relatives were invited to the reading of her will. She wanted to leave all of her *ratnas* to her son, but she knew that if she did so, all their relatives would pester Khoisnam forever. She hoped that she had taught him everything he needed to know about solving puzzles. She left the following note in her will—

> “I have created a puzzle. If all 100 of you answer it at the same time, you will share the ratnas equally. However, if you are the first one to solve the problem, you will get to keep the entire inheritance to yourself. Good luck.”

The minister took Khoisnam and his 99 relatives to a secret room in the mansion containing 100 lockers.
The minister explained— “Each person is assigned a number from 1 to 100.

* Person 1 opens every locker.
* Person 2 toggles every 2nd locker (i.e., closes it if it is open, opens it if it is closed).
* Person 3 toggles every 3rd locker (3rd, 6th, 9th, … and so on).
* Person 4 toggles every 4th locker (4th, 8th, 12th, … and so on).

This continues until all 100 get their turn.
In the end, only some lockers remain open. The open lockers reveal the code to the fortune in the safe.”

The page features an illustration of a grand room with a long row of lockers. In the foreground, two men in traditional Indian royal attire, including turbans and ornate robes, are engaged in conversation. One man, likely the minister, is gesturing towards the lockers while the other, Khoisnam, listens thoughtfully.

? Before the process begins, Khoisnam realises that he already knows which lockers will be open at the end.
How did he figure out the answer?
**Hint:** Find out how many times each locker is toggled.

If a locker is toggled an odd number of times, it will be open. Otherwise, it will be closed. The number of times a locker is toggled is the same as the number of factors of the locker number. For example, for locker #6, Person 1 opens it, Person 2 closes it, Person 3 opens it and Person 6 closes it. The numbers 1, 2, 3, and 6 are factors of 6. If the number of factors is even, the locker will be toggled by an even number of people and it will eventually be closed.

Note that each factor of a number has a 'partner factor' so that the product of the pair of factors yields the given number. Here, 1 and 6 form a pair of partner factors of 6, and 2 and 3 form another pair.

<table>
  <tbody>
    <tr>
        <td>6:</td>
        <td colspan="2"></td>
    </tr>
    <tr>
        <td>1 × 6</td>
        <td colspan="2"></td>
    </tr>
    <tr>
        <td>2 × 3</td>
        <td colspan="2"></td>
    </tr>
    <tr>
        <td>Factors are 1</td>
        <td>2</td>
        <td>3 and 6.</td>
    </tr>
  </tbody>
</table>

> ? Does every number have an even number of factors?

<table>
  <tbody>
    <tr>
        <td>1:</td>
        <td>4:</td>
        <td>9:</td>
    </tr>
    <tr>
        <td>1 × 1</td>
        <td>1 × 4</td>
        <td>1 × 9</td>
    </tr>
    <tr>
        <td>The only factor is 1.</td>
        <td>2 × 2</td>
        <td>3 × 3</td>
    </tr>
    <tr>
        <td></td>
        <td>Factors are 1, 2 and 4.</td>
        <td>Factors are 1, 3 and 9.</td>
    </tr>
  </tbody>
</table>

We see in some cases, like $2 \times 2$, that the numbers in the pair are the same.

> ? Can you use this insight to find more numbers with an odd number of factors?

For instance, 36 has a factor pair $6 \times 6$ where both numbers are 6. Does this number have an odd number of factors? If every factor of 36 other than 6 has a different factor as its partner, then we can be sure that 36 has an odd number of factors. Check if this is true.

Hence all the following numbers have an odd number of factors —
$$1 \times 1, 2 \times 2, 3 \times 3, 4 \times 4, \dots$$

A number that can be expressed as the product of a number with itself is called a **square number**, or simply a **square**. The only numbers that have an odd number of factors are the squares, because they each have one factor which, when multiplied by itself, equals the number. Therefore, every locker whose number is a square will remain open.

(Question Icon) Write the locker numbers that remain open.

> Khoisnam immediately collects word clues from these 10 lockers and reads, “The passcode consists of the first five locker numbers that were touched exactly twice.”
>
> (Question Icon) Which are these five lockers?
>
> The lockers that are toggled twice are the prime numbers, since each prime number has 1 and the number itself as factors. So, the code is 2-3-5-7-11.

## 1.1 Square Numbers

Why are the numbers, 1, 4, 9, 16, ..., called squares? We know that the number of unit squares in a square (the area of a square) is the product of its sides. The table below gives the areas of squares with different sides.

<table>
  <thead>
    <tr>
        <th>Sidelength (in units)</th>
        <th>Area (in sq units)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>1</td>
        <td>1 × 1 = 1 sq. unit</td>
    </tr>
    <tr>
        <td>2</td>
        <td>2 × 2 = 4 sq. units</td>
    </tr>
    <tr>
        <td>3</td>
        <td>3 × 3 = 9 sq. units</td>
    </tr>
    <tr>
        <td>4</td>
        <td>4 × 4 = 16 sq. units</td>
    </tr>
    <tr>
        <td>5</td>
        <td>5 × 5 = 25 sq. units</td>
    </tr>
    <tr>
        <td>10</td>
        <td>10 × 10 = 100 sq. units</td>
    </tr>
  </tbody>
</table>

The following figure represents a square with a sidelength of 5 units, composed of 25 unit squares.

<table>
  <tbody>
    <tr>
        <td colspan="5"></td>
    </tr>
  </tbody>
</table>

We use the following notation for squares.
$$1 \times 1 = 1^2 = 1$$
$$2 \times 2 = 2^2 = 4$$
$$3 \times 3 = 3^2 = 9,$$
$$4 \times 4 = 4^2 = 16$$
$$5 \times 5 = 5^2 = 25.$$
$$\vdots$$

In general, for any number $n$, we write $n \times n = n^2$, which is read as '$n$ squared'.

Can we have a square of sidelength $\frac{3}{5}$ or 2.5 units?

Yes, their area in square units are $(\frac{3}{5})^2 = (\frac{3}{5}) \times (\frac{3}{5}) = (\frac{9}{25})$, and $(2.5)^2 = (2.5) \times (2.5) = 6.25$.

The squares of natural numbers are called **perfect squares**. For example, 1, 4, 9, 16, 25, ... are all perfect squares.

## Patterns and Properties of Perfect Squares

Find the squares of the first 30 natural numbers and fill in the table below.

<table>
  <tbody>
    <tr>
        <td>1² = 1</td>
        <td>11² = 121</td>
        <td>21² = 441</td>
    </tr>
    <tr>
        <td>2² = 4</td>
        <td>12² =</td>
        <td>22² =</td>
    </tr>
    <tr>
        <td>3² = 9</td>
        <td>13² =</td>
        <td>23² =</td>
    </tr>
    <tr>
        <td>4² = 16</td>
        <td>14² =</td>
        <td>24² =</td>
    </tr>
    <tr>
        <td>5² = 25</td>
        <td>15² =</td>
        <td>25² =</td>
    </tr>
    <tr>
        <td>6² =</td>
        <td>16² =</td>
        <td>26² =</td>
    </tr>
    <tr>
        <td>7² =</td>
        <td>17² =</td>
        <td>27² =</td>
    </tr>
    <tr>
        <td>8² =</td>
        <td>18² =</td>
        <td>28² =</td>
    </tr>
    <tr>
        <td>9² =</td>
        <td>19² =</td>
        <td>29² =</td>
    </tr>
    <tr>
        <td>10² =</td>
        <td>20² =</td>
        <td>30² =</td>
    </tr>
  </tbody>
</table>

> ? What patterns do you notice? Share your observations and make conjectures.
>
> **Math Talk**

Study the squares in the table above. What are the digits in the units places of these numbers? All these numbers end with 0, 1, 4, 5, 6 or 9. None of them end with 2, 3, 7 or 8.

> ? If a number ends in 0, 1, 4, 5, 6 or 9, is it always a square?
>
> **Math Talk**

The numbers 16 and 36 are both squares with 6 in the units place. However, 26, whose units digit is also 6, is not a square. Therefore, we cannot determine if a number is a square just by looking at the digit in the units place. But, the units digit can tell us when a number is not a square. If a number ends with 2, 3, 7, or 8, then we can definitely say that it is not a square.

> ? Write 5 numbers such that you can determine by looking at their units digit that they are not squares.

The squares, $1^2$, $9^2$, $11^2$, $19^2$, $21^2$, and $29^2$, all have 1 in their units place. Write the next two squares. Notice that if a number has 1 or 9 in the units place, then its square ends in 1.

> ? Let us consider square numbers ending in 6: $16 = 4^2$, $36 = 6^2$, $196 = 14^2$, $256 = 16^2$, $576 = 24^2$, and $676 = 26^2$.

Which of the following numbers have the digit 6 in the units place?
(i) $38^2$ (ii) $34^2$ (iii) $46^2$ (iv) $56^2$ (v) $74^2$ (vi) $82^2$

? Find more such patterns by observing the numbers and their squares from the table you filled earlier.

Consider the following numbers and their squares.

<table>
  <thead>
    <tr>
        <th>Input Observation</th>
        <th>Equations</th>
        <th>Output Observation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>We have one zero.</td>
        <td>$10^2 = 100$<br/>$20^2 = 400$<br/>$40^2 = 1600$</td>
        <td>But we have two zeroes.</td>
    </tr>
    <tr>
        <td>We have two zeroes.</td>
        <td>$100^2 = 10000$<br/>$200^2 = 40000$<br/>$700^2 = 490000$<br/>$900^2 = 810000$</td>
        <td>But we have four zeroes.</td>
    </tr>
  </tbody>
</table>

? If a number contains 3 zeros at the end, how many zeros will its square have at the end?

? What do you notice about the number of zeros at the end of a number and the number of zeros at the end of its square? Will this always happen? Can we say that squares can only have an even number of zeros at the end?

? What can you say about the parity of a number and its square?

### Perfect Squares and Odd Numbers

Let us explore the differences between consecutive squares. What do you notice?

$4 - 1 = 3$
$9 - 4 = 5$
$16 - 9 = 7$
$25 - 16 = 9$

See if this pattern continues for the next few square numbers.

From this we observe that adding consecutive odd numbers starting from 1 gives consecutive square numbers, as shown below.

$1 = 1$
$1 + 3 = 4$
$1 + 3 + 5 = 9$
$1 + 3 + 5 + 7 = 16$
$1 + 3 + 5 + 7 + 9 = 25$
$1 + 3 + 5 + 7 + 9 + 11 = 36$

The following diagram illustrates this pattern using a $6 \times 6$ grid of dots, where each L-shaped layer represents an odd number being added to form the next square.

<table>
  <tbody>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
    <tr>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
        <td>●</td>
    </tr>
  </tbody>
</table>

Do you remember this pattern from Grade 6?
The picture below explains why each subsequent inverted L gives the next odd number:

<table>
  <thead>
    <tr>
        <th>Figure 1</th>
        <th>$\rightarrow$</th>
        <th>Figure 2</th>
        <th>$\rightarrow$</th>
        <th>Figure 3</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>A 2x2 grid of dots. 1 dot is separated from an inverted L-shape of 3 dots.</td>
        <td></td>
        <td>A 3x3 grid of dots. A 2x2 subgrid is separated from an inverted L-shape of 5 dots.</td>
        <td></td>
        <td>A 4x4 grid of dots. A 3x3 subgrid is separated from an inverted L-shape of 7 dots.</td>
    </tr>
    <tr>
        <td>$1 + 3$</td>
        <td></td>
        <td>$1 + 3 + (3 + 2)$ <br/> $1 + 3 + 5$</td>
        <td></td>
        <td>$1 + 3 + 5 + (5 + 2)$ <br/> $1 + 3 + 5 + 7$</td>
    </tr>
  </tbody>
</table>

We see that the sum of the first $n$ odd numbers is $n^{2}$. Alternatively, every square is a sum of successive odd numbers starting from 1.

> In mathematics, sometimes arguments and reasoning can be presented without any words. Visual proofs can be complete by themselves.

Also, we can find out whether a number is a perfect square by successively subtracting odd numbers. Consider the number 25, successively subtract 1, 3, 5, ... until you get or cross over 0,

$$25 - 1 = 24 \quad 24 - 3 = 21 \quad 21 - 5 = 16 \quad 16 - 7 = 9 \quad 9 - 9 = 0$$

This means $25 = 1 + 3 + 5 + 7 + 9$ and is thus a perfect square. Since we subtracted the first five odd numbers, $25 = 5^{2}$.

Using the pattern above, find $36^{2}$, given that $35^{2} = 1225$.
From the question we know that 1225 is the sum of the first 35 odd numbers. To find $36^{2}$, we need to add the 36th odd number to 1225.
How do we find the 36th odd number?
The 1st odd number is 1, 2nd odd number is 3, 3rd number is 5, ..., 6th odd number is 11 and so on.
What is the $n^{th}$ odd number?
The $n^{th}$ odd number is $2n - 1$.
Therefore, the 36th odd number is 71.
By adding 71 to 1225, we get 1296, which is $36^{2}$.
Consider a number such as 38 that is not a square and subtract consecutive odd numbers starting from 1.

$$38 - 1 = 37 \quad 37 - 3 = 34 \quad 34 - 5 = 29 \quad 29 - 7 = 22 \quad 22 - 9 = 13$$
$$13 - 11 = 2 \quad 2 - 13 = -11$$

This shows that 38 cannot be expressed as a sum of consecutive odd numbers starting with 1.

Thus, we can say that a natural number is not a perfect square if it cannot be expressed as a sum of successive odd natural numbers starting from 1. We can use this result to find out whether a natural number is a perfect square.

* Find how many numbers lie between two consecutive perfect squares. Do you notice a pattern?
* How many square numbers are there between 1 and 100? How many are between 101 and 200? Using the table of squares you filled earlier, enter the values below, tabulating the number of squares in each block of 100. What is the largest square less than 1000?

<table>
  <tbody>
    <tr>
        <td>1 – 100</td>
        <td>101 – 200</td>
        <td>201 – 300</td>
        <td>301 – 400</td>
        <td>401 – 500</td>
    </tr>
    <tr>
        <td>___</td>
        <td>___</td>
        <td>___</td>
        <td>___</td>
        <td>___</td>
    </tr>
    <tr>
        <td>501 – 600</td>
        <td>601 – 700</td>
        <td>701 – 800</td>
        <td>801 – 900</td>
        <td>901 – 1000</td>
    </tr>
    <tr>
        <td>___</td>
        <td>___</td>
        <td>___</td>
        <td>___</td>
        <td>___</td>
    </tr>
  </tbody>
</table>

## Perfect Squares and Triangular Numbers

Do you remember triangular numbers?

The following diagrams show triangular numbers represented by dots:
* **1**: A single dot.
* **3**: Three dots arranged in a triangle (1 dot on top, 2 dots on the bottom).
* **6**: Six dots arranged in a triangle (1 dot on top, 2 in the middle, 3 on the bottom).
* **10**: Ten dots arranged in a triangle (1 dot on top, 2, 3, then 4 dots on the bottom).
* **15**: Fifteen dots arranged in a triangle (1 dot on top, 2, 3, 4, then 5 dots on the bottom).

* Can you see any relation between triangular numbers and square numbers? Extend the pattern shown and draw the next term.

The following diagrams show how two consecutive triangular numbers can be combined to form a square number:

* $1 + 3 = 4 = 2^2$: A $2 \times 2$ grid of dots, where 1 dot is separated from 3 dots by a line.
* $3 + 6 = 9 = 3^2$: A $3 \times 3$ grid of dots, where 3 dots are separated from 6 dots by a zig-zag line.
* $6 + 10 = 16 = 4^2$: A $4 \times 4$ grid of dots, where 6 dots are separated from 10 dots by a zig-zag line.

[A blank box is provided to draw the next term in the sequence.]

## Square Roots

* The area of a square is 49 sq. cm. What is the length of its side?
We know that $7 \times 7 = 49$, or $7^2 = 49$.

So, the length of the side of a square with an area of 49 sq. cm is 7 cm.
We call 7 the **square root** of 49.
In general, if $y = x^2$ then $x$ is the **square root** of $y$.

**? What is the square root of 64?**
We know that $8 \times 8$ is 64. So, 8 is the square root of 64. What about $-8 \times -8$? That is 64 too!
$8^2 = 64$, and $(-8)^2 = 64$.
So, the square roots of 64 are $+8$ and $-8$.
Every perfect square has two integer square roots. One is positive and the other is negative. The square root of a number is denoted by $\sqrt{}$.
Thus, $\sqrt{64} = \pm 8$ and $\sqrt{100} = \pm 10$.
Note that $\sqrt{8^2} = \pm 8$ and $\sqrt{10^2} = \pm 10$. In general, $\sqrt{n^2} = \pm n$.
In this chapter, we shall only consider the positive square root.

**? Given a number, such as 576 or 327, how do we find out if it is a perfect square? If it is a perfect square, how can we find its square root?**

> **Math Talk**

We know that perfect squares end in 1, 4, 9, 6, 5, or an even number of zeros. But, it is not certain that a number that satisfies this condition is a square.
We can clearly say that 327 is not a perfect square. However, we cannot be sure that 576 is a perfect square.

1. We can list all the square numbers in sequence and find out whether 576 occurs among them. We know that $20^2 = 400$, we can find squares of 21, 22, 23, ... and so on until we get 576 or a number greater than 576.
   $$20^2 = 400 \quad 21^2 = 441 \quad 22^2 = 484 \quad 23^2 = 529 \quad 24^2 = 576$$
   However, this process becomes inefficient for larger numbers.

2. Recall that every square can be expressed as a sum of consecutive odd numbers starting from 1.
   Consider $\sqrt{81}$.

<table>
  <tbody>
    <tr>
        <td>81 - 1 = 80</td>
        <td>80 - 3 = 77</td>
        <td>77 - 5 = 72</td>
        <td>72 - 7 = 65</td>
        <td>65 - 9 = 56</td>
    </tr>
    <tr>
        <td>56 - 11 = 45</td>
        <td>45 - 13 = 32</td>
        <td>32 - 15 = 17</td>
        <td>17 - 17 = 0</td>
        <td></td>
    </tr>
  </tbody>
</table>

From 81, we successively subtracted consecutive odd numbers starting from 1 until we obtained 0 at the 9th step. Therefore $\sqrt{81} = 9$.
Can we find the square root of 729 using this method? Yes, but it will be time-consuming.

3. We know that a perfect square is obtained by multiplying an integer by itself. Will looking at a number’s prime factorisation help in determining whether it is a perfect square?
   Yes, if we can divide the prime factors of a number into two equal groups, then the product of the prime factors in either group combine to form the square root.

**Is 324 a perfect square?**
$$324 = 2 \times 2 \times 3 \times 3 \times 3 \times 3.$$
These can be grouped as
$$324 = (2 \times 3 \times 3) \times (2 \times 3 \times 3).$$
$$= (2 \times 3 \times 3)^2 = 18^2.$$
We can also write the prime factors in pairs. That is,
$$324 = (2 \times 2) \times (3 \times 3) \times (3 \times 3),$$
which shows that 324 is a perfect square. Thus,
$$324 = (2 \times 3 \times 3)^2 = 18^2.$$
Therefore, $\sqrt{324} = 18$.

**Is 156 a perfect square?**
The prime factorisation of 156 is $2 \times 2 \times 3 \times 13$.
We cannot pair up these factors.
Therefore, 156 is not a perfect square.

**Find whether 1156 and 2800 are perfect squares using prime factorisation.**

We can estimate the square root of larger perfect squares by looking at the closest perfect squares we are familiar with and then narrowing down the interval to search.

For example, to find $\sqrt{1936}$, we can reason as follows:
(i) 1936 is between 1600 ($40^2$) and 2500 ($50^2$), so $40 < \sqrt{1936} < 50$.
(ii) The last digit of 1936 is 6. So, the last digit of the square root must either be 4 or 6. It can be 44 or 46.
(iii) If we calculate $45^2$, we can compare it with 1936 to halve the interval to search from 40–50 to either 40–45 or 45–50.
We can write $45^2$ as $(40 + 5) (40 + 5) = 40^2 + 2 \times 40 \times 5 + 5^2$
$= 1600 + 400 + 25 = 2025$.
(iv) $2025 > 1936$. So, $40 < \sqrt{1936} < 45$
(v) From the observation in point b we can guess and then verify that $\sqrt{1936}$ is 44.

Consider the following situations —
Aribam and Bijou play a game. One says a number and the other replies with its square root. Aribam starts. He says 25, and Bijou quickly

responds with 5. Then Bijou says 81, and Aribam answers 9. The game goes on till Aribam says 250. Bijou is not able to answer because 250 is not a perfect square. Aribam asks Bijou if he can at least provide a number that is close to the square root of 250.

For this, Bijou needs to estimate the square root of 250.
We know that $100 < 250 < 400$ and $\sqrt{100} = 10$ and $\sqrt{400} = 20$.
So, $10 < \sqrt{250} < 20$.
But, we are still not very close to the number whose square is 250.
We know that $15^2 = 225$ and $16^2 = 256$.
Therefore, $15 < \sqrt{250} < 16$. Since 256 is much closer to 250 than 225, $\sqrt{250}$ is approximately 16. We also know it is less than 16.

Here is another problem that requires estimating square roots.
Akhil has a square piece of cloth of area 125 cm<sup>2</sup>. He wants to know if he can cut out a square handkerchief of side 15 cm. If not, he wants to know the maximum size handkerchief that can be cut out from this piece of cloth with an integer side length.
125 is not a perfect square. The nearest perfect squares are $11^2 = 121$ and $12^2 = 144$. So the largest square handkerchief with integer side length that can be cut out from this piece of cloth has side length 11 cm.

## Figure it Out

1. Which of the following numbers are not perfect squares?
   (i) 2032 (ii) 2048 (iii) 1027 (iv) 1089
2. Which one among $64^2, 108^2, 292^2, 36^2$ has last digit 4?
3. Given $125^2 = 15625$, what is the value of $126^2$?
   (i) $15625 + 126$ (ii) $15625 + 26^2$ (iii) $15625 + 253$
   (iv) $15625 + 251$ (v) $15625 + 51^2$
4. Find the length of the side of a square whose area is 441 m<sup>2</sup>.
5. Find the smallest square number that is divisible by each of the following numbers: 4, 9, and 10.
6. Find the smallest number by which 9408 must be multiplied so that the product is a perfect square. Find the square root of the product.
7. How many numbers lie between the squares of the following numbers?
   (i) 16 and 17 (ii) 99 and 100
8. In the following pattern, fill in the missing numbers:

<table>
  <tbody>
    <tr>
        <td>1^2</td>
        <td>=</td>
        <td>1</td>
    </tr>
    <tr>
        <td>11^2</td>
        <td>=</td>
        <td>121</td>
    </tr>
    <tr>
        <td>111^2</td>
        <td>=</td>
        <td>12321</td>
    </tr>
    <tr>
        <td>1111^2</td>
        <td>=</td>
        <td>1234321</td>
    </tr>
    <tr>
        <td>11111^2</td>
        <td>=</td>
        <td>_______</td>
    </tr>
    <tr>
        <td>_______</td>
        <td>=</td>
        <td>1234567654321</td>
    </tr>
  </tbody>
</table>

$$1^2 + 2^2 + 2^2 = 3^2$$
$$2^2 + 3^2 + 6^2 = 7^2$$
$$3^2 + 4^2 + 12^2 = 13^2$$
$$4^2 + 5^2 + 20^2 = (\_\_\_)^2$$
$$9^2 + 10^2 + (\_\_\_)^2 = (\_\_\_)^2$$

9. How many tiny squares are there in the following picture? Write the prime factorisation of the number of tiny squares.

The image shows a large green square containing an $8 \times 8$ grid of smaller square blocks. Each of these 64 blocks is itself a $4 \times 4$ grid of tiny white squares. In total, there are $8 \times 8 \times 4 \times 4 = 1024$ tiny squares.

## 1.2 Cubic Numbers

You know the word **cube** from geometry. A cube is a solid figure all of whose all sides meet at right angles and are equal. How many cubes of side 1 cm make a cube of side 2 cm?

The image illustrates this with a single unit cube (side 1 cm) and a larger cube (side 2 cm) composed of 8 unit cubes arranged in a $2 \times 2 \times 2$ configuration.

> ? How many cubes of side 1 cm will make a cube of side 3 cm?

Consider the numbers 1, 8, 27, ...
These numbers are called **perfect cubes**. Can you see why they are named so?
Each of them is obtained by multiplying a number by itself three times. We note that
$$1 = 1 \times 1 \times 1$$
$$8 = 2 \times 2 \times 2$$
$$27 = 3 \times 3 \times 3$$

[?] **Is 9 a cube?**
We see that $2 \times 2 \times 2 = 8$ and $3 \times 3 \times 3 = 27$. This shows that 9 is not a perfect cube. Nor is any number from 10 to 26.

[?] **Can you estimate the number of unit cubes in a cube with an edge length of 4 units?**
It has 64 unit cubes! If you notice carefully, each layer of this cube has $4 \times 4$ unit cubes. Each square layer has 16 unit cubes ($4 \times 4$), and there are 4 such layers, so the total number of unit cubes is $4 \times 4 \times 4 = 64$.

The image shows a large cube composed of $4 \times 4 \times 4 = 64$ smaller unit cubes, illustrated in a 3D perspective to show its depth and layers.

Since $5^3 = 5 \times 5 \times 5 = 125$, 125 is a cube.
**In general, for any number $n$, we write the cube $n \times n \times n$ as $n^3$.**

[?] **Complete the table below.**

<table>
  <tbody>
    <tr>
        <td>1^3 = 1</td>
        <td>11^3 = 1331</td>
    </tr>
    <tr>
        <td>2^3 = 8</td>
        <td>12^3 =</td>
    </tr>
    <tr>
        <td>3^3 = 27</td>
        <td>13^3 = 2197</td>
    </tr>
    <tr>
        <td>4^3 = 64</td>
        <td>14^3 = 2744</td>
    </tr>
    <tr>
        <td>5^3 = 125</td>
        <td>15^3 =</td>
    </tr>
    <tr>
        <td>6^3 =</td>
        <td>16^3 =</td>
    </tr>
    <tr>
        <td>7^3 =</td>
        <td>17^3 = 4913</td>
    </tr>
    <tr>
        <td>8^3 =</td>
        <td>18^3 = 5832</td>
    </tr>
    <tr>
        <td>9^3 =</td>
        <td>19^3 = 6859</td>
    </tr>
    <tr>
        <td>10^3 =</td>
        <td>20^3 =</td>
    </tr>
  </tbody>
</table>

[?] **What patterns do you notice in the table above?**

> **Math Talk**
> [?] We know that 0, 1, 4, 5, 6, 9 are the only last digits possible for

squares. What are the possible last digits of cubes?

[?] Similar to squares, can you find the number of cubes with 1 digit, 2 digits, and 3 digits? What do you observe?

[?] Can a cube end with exactly two zeroes (00)? Explain.

Just as we can take squares of fractions/decimals — $(\frac{4}{6})^2$, $(13.08)^2$, and $(-6)^2$ — we also can compute cubes of such numbers — $(\frac{4}{6})^3$, $(13.08)^3$, and $(-6)^3$.

$$(\frac{4}{6})^3 = (\frac{4}{6}) \times (\frac{4}{6}) \times (\frac{4}{6}) = (\frac{64}{216})$$

$$(13.08)^3 = 13.08 \times 13.08 \times 13.08 = 2237.810112$$

$$(-6)^3 = -6 \times -6 \times -6 = -216$$

## Taxicab Numbers

Once when Srinivasa Ramanujan was working with G. H. Hardy at the University of Cambridge, Hardy had come to visit Ramanujan at a hospital when he was ill. Hardy had ridden in a taxicab numbered 1729 and he remarked that 1729 was ‘rather a dull number,’ adding that he hoped that this was not a bad sign. Ramanujan immediately replied, “No, Hardy, it is a very interesting number. It is the smallest number that can be expressed as the sum of two cubes in two different ways”.

$$1729 = 1^3 + 12^3$$
$$= 9^3 + 10^3.$$

Because of this story, 1729 has since been known as the **Hardy–Ramanujan Number**. And numbers that can be expressed as the sum of two cubes in two different ways are called **taxicab numbers**.

An illustration depicts G.H. Hardy visiting Srinivasa Ramanujan in a hospital. Ramanujan is sitting up in bed, and Hardy is standing by the bedside, holding his hat and looking at Ramanujan.

> **Try This**
>
> The next two taxicab numbers after 1729 are 4104 and 13832. Find the two ways in which each of these can be expressed as the sum of two positive cubes.

How did Ramanujan know this? Well, he loved numbers. All through his life, he tinkered with numbers. During Ramanujan’s time in Cambridge, his colleagues often marveled at his ability to see deep patterns in numbers that seemed arbitrary to others. His colleague, John Littlewood, once said, “Every positive integer was one of his [Ramanujan's] personal friends”.

# Perfect Cubes and Consecutive Odd Numbers

Consecutive odd numbers have a role to play with cubes too. Look at the following pattern:

$$1 = 1 = 1^3$$
$$3 + 5 = 8 = 2^3$$
$$7 + 9 + 11 = 27 = 3^3$$
$$13 + 15 + 17 + 19 = 64 = 4^3$$
$$21 + 23 + 25 + 27 + 29 = 125 = 5^3$$
$$31 + 33 + 35 + 37 + 39 + 41 = 216 = 6^3$$

Later in this series, we get the following set of consecutive numbers:
$$91 + 93 + 95 + 97 + 99 + 101 + 103 + 105 + 107 + 109.$$

* Can you tell what this sum is without doing the calculation?

## Cube Roots

We know that $8 = 2^3$.
We call 2 the cube root of 8 and denote this by $2 = \sqrt[3]{8}$.
More generally, if $y = x^3$, then $x$ is the cube root of $y$. This is denoted by $x = \sqrt[3]{y}$. So, $\sqrt[3]{8} = \sqrt[3]{2^3} = 2$.
Similarly, $\sqrt[3]{27} = \sqrt[3]{3^3} = 3$ and $\sqrt[3]{1000} = \sqrt[3]{10^3} = 10$. In general, $\sqrt[3]{n^3} = n$.

How do we find out if a number is a cube? Taking inspiration from the case of squares, let us see if we can use prime factorisations.

* Let us check if 3375 is a perfect cube.
$$3375 = 3 \times 3 \times 3 \times 5 \times 5 \times 5.$$
Can the factors be split into three identical groups? For 3375, we can form three groups of $(3 \times 5)$. So,
$$3375 = (3 \times 5) \times (3 \times 5) \times (3 \times 5)$$
$$= (3 \times 5)^3 = 15^3.$$
Another way is to check if the factors can be grouped into triplet(s):
$$3375 = (3 \times 3 \times 3) \times (5 \times 5 \times 5) = 3^3 \times 5^3.$$
This means $\sqrt[3]{3375} = 15$.

* Is 500 a perfect cube?
$500 = 2 \times 2 \times 5 \times 5 \times 5$. We see that the factors cannot be split into three identical groups. Therefore, 500 is not a perfect cube.

<table>
  <thead>
    <tr>
        <th>Prime Factorisation of a Number</th>
        <th>Prime Factorisation of its Cube</th>
    </tr>
  </thead>
  <tbody>
    <tr>
        <td>4 = 2 × 2</td>
        <td>4³ = 64 = 2 × 2 × 2 × 2 × 2 × 2 = 2³ × 2³</td>
    </tr>
    <tr>
        <td>6 = 2 × 3</td>
        <td>6³ = 216 = 2 × 2 × 2 × 3 × 3 × 3 = 2³ × 3³</td>
    </tr>
    <tr>
        <td>15 = 3 × 5</td>
        <td>15³ = 3375 = 3 × 3 × 3 × 5 × 5 × 5 = 3³ × 5³</td>
    </tr>
    <tr>
        <td>12 = 2 × 2 × 3</td>
        <td>12³ = 1728 = 2 × 2 × 2 × 2 × 2 × 2 × 3 × 3 × 3<br/>= 2³ × 2³ × 3³</td>
    </tr>
  </tbody>
</table>

Observe that each prime factor of a number appears three times in the prime factorisation of its cube.

? Find the cube roots of these numbers:
(i) $\sqrt[3]{64} =$
(ii) $\sqrt[3]{512} =$
(iii) $\sqrt[3]{729} =$

## Successive Differences
We know that the differences between consecutive perfect squares gives the sequence of odd numbers. Observe the figure below where the differences are computed successively for perfect squares. After two levels, all the differences are the same.

**Perfect Squares**
<table>
  <tbody>
    <tr>
        <td>Perfect Squares</td>
        <td>1</td>
        <td></td>
        <td>4</td>
        <td></td>
        <td>9</td>
        <td></td>
        <td>16</td>
        <td></td>
        <td>25</td>
        <td></td>
        <td>36</td>
        <td>...</td>
    </tr>
    <tr>
        <td>Level 1</td>
        <td></td>
        <td>3</td>
        <td></td>
        <td>5</td>
        <td></td>
        <td>7</td>
        <td></td>
        <td>9</td>
        <td></td>
        <td>11</td>
        <td></td>
        <td>...</td>
    </tr>
    <tr>
        <td>Level 2</td>
        <td></td>
        <td></td>
        <td>2</td>
        <td></td>
        <td>2</td>
        <td></td>
        <td>2</td>
        <td></td>
        <td>2</td>
        <td></td>
        <td></td>
        <td>...</td>
    </tr>
  </tbody>
</table>

? Compute successive differences over levels for perfect cubes until all the differences at a level are the same. What do you notice?

**Perfect Cubes**
<table>
  <tbody>
    <tr>
        <td>Perfect Cubes</td>
        <td>1</td>
        <td></td>
        <td>8</td>
        <td></td>
        <td>27</td>
        <td></td>
        <td>64</td>
        <td></td>
        <td>125</td>
        <td></td>
        <td>216</td>
        <td>...</td>
    </tr>
  </tbody>
</table>

## 1.3 A Pinch of History
The first known list of perfect squares and perfect cubes was compiled by the Babylonians as far back as 1700 BCE. These lists, found on clay tablets, were used to quickly find square roots and cube

The image shows an ancient Babylonian clay tablet with cuneiform inscriptions, representing early mathematical records.

roots in problems involving land measurement, architectural design, and other areas where geometric calculations were necessary.

In ancient Sanskrit works the term varga was used both for the square figure or its area, as well as the square power, and the term ghana was used both for the solid cube as well as the product of a number with itself three times. The fourth power was called varga-varga. These terms were used in India at least from the third century BCE.

**Aryabhata (499 CE) states**

> “A square figure of four equal sides and the number representing its area are called varga. The product of two equal quantities is also called varga.”

Thus, the term varga for square power has its origin in the graphical representation of a square figure.

Why is the word ‘root’ (the root of a plant) used for the mathematical operation $\sqrt{}$ (square root, cube root, etc.)?

It is because, in ancient India, the Sanskrit word mula, meaning root of a plant, basis, cause, origin, etc., was used for the mathematical operations of taking roots.

In Sanskrit, varga-mula (the basis, cause, origin of the square) was used for square-root and ghana-mula was used for cube-root. This use of mula for the mathematical concept of root was subsequently emulated in Arabic and Latin through their corresponding words for the root of a plant — jidhr and radix respectively. The term mula for root has been used in India at least from the first century BCE. Another term used was pada (foot, basis, cause, origin). Brahmagupta (628 CE) explains, ‘The pada (root) of a krti (square) is that of which it is a square.’

# Figure it Out

1. Find the cube roots of 27000 and 10648.
2. What number will you multiply by 1323 to make it a cube number?
3. State true or false. Explain your reasoning.
    (i) The cube of any odd number is even.
    (ii) There is no perfect cube that ends with 8.
    (iii) The cube of a 2-digit number may be a 3-digit number.
    (iv) The cube of a 2-digit number may have seven or more digits.
    (v) Cube numbers have an odd number of factors.
4. You are told that 1331 is a perfect cube. Can you guess without factorisation what its cube root is? Similarly, guess the cube roots of 4913, 12167, and 32768.

5. Which of the following is the greatest? Explain your reasoning.
(i) $$67^3 - 66^3$$ (ii) $$43^3 - 42^3$$ (iii) $$67^2 - 66^2$$ (iv) $$43^2 - 42^2$$

# SUMMARY

*   A number obtained by multiplying a number by itself is called a **square number**. Squares of natural numbers are called **perfect squares**.
*   All perfect squares end with 0, 1, 4, 5, 6 or 9. Squares can only have an even number of zeros at the end.
*   **Square root** is the inverse operation of square. Every perfect square has two integral square roots. The positive square root of a number is denoted by the symbol $$\sqrt{}$$. For example, $$\sqrt{9} = 3$$.
*   A **number** obtained by multiplying a number by itself three times is called a **cube**. For example 1, 8, 27, ... ,etc., are cubes.
*   A number is a perfect square if its prime factors can be split into two identical groups.
*   A number is a perfect cube if its prime factors can be split into three identical groups.
*   The symbol $$\sqrt[3]{}$$ denotes cube root. For example, $$\sqrt[3]{27} = 3$$.

Look at the following numbers: 3 6 10 15 1

They are arranged such that each pair of adjacent numbers adds up to a square.

$$3 + 6 = 9, 6 + 10 = 16, 10 + 15 = 25, 15 + 1 = 16.$$

Try arranging the numbers 1 to 17 (without repetition) in a row in a similar way — the sum of every adjacent pair of numbers should be a square.

[ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ]

Can you arrange them in more than one way? If not, can you explain why?

Can you do the same with numbers from 1 to 32 (again, without repetition), but this time arranging all the numbers in a circle?

A circular arrangement of 32 empty pink squares is provided for this puzzle.

At the top of the page (when oriented for reading), a group of children are shown peering over a bamboo fence. An owl wearing a graduation cap and glasses is perched on the bamboo sign containing the title "Square Pairs!".